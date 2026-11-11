# Spike técnico — Cuentas, órdenes y portfolio

**Objetivo:** entender cómo calcular el saldo, las tenencias, el precio promedio de compra y el valor de mercado con el modelo actual, encontrar problemas en los datos y recomendar cómo evolucionar el modelo. Este Spike fundamenta la propuesta; el **ADR-001** define cómo se implementa.

## 1. Qué hay hoy

| Tabla | Qué guarda | Observación |
|---|---|---|
| `users` | `id`, `email`, `accountNumber` | No guarda saldo ni posiciones. |
| `instruments` | `id`, `ticker`, `name`, `type` | Los pesos están cargados como un instrumento de tipo `MONEDA` (id 66). |
| `orders` | `instrumentId`, `userId`, `side`, `size`, `price`, `type`, `status`, `datetime` | Mezcla compras y ventas con ingresos y retiros de dinero. |
| `marketdata` | `open`, `high`, `low`, `close`, `previousClose`, `date` | Precios de los últimos dos días de cada instrumento. |

La muestra tiene 4 usuarios, 66 instrumentos, 11 órdenes (todas del usuario 1) y 126 cotizaciones.

**Cómo se leen los datos:** el importe de cada orden es la cantidad por el precio (`size × price`). En los ingresos y retiros (`CASH_IN` / `CASH_OUT`) el precio es 1, así que la cantidad ya son pesos. Solo las órdenes ejecutadas (`FILLED`) mueven el saldo y las tenencias: los ingresos y las ventas suman pesos, y los retiros y las compras los restan.

## 2. Reconstrucción paso a paso

Ordenamos las órdenes por fecha (y por id si coinciden) y arrancamos con saldo y tenencias en cero, porque no tenemos información de saldos iniciales.

| ID | Fecha (2023) | Instr. | Operación · estado | Cantidad × precio | Saldo | 47 / 31 / 54 |
|---:|---|---:|---|---:|---:|---|
| 1 | 12/07 12:11 | 66 | Ingreso · FILLED | 1.000.000 × 1 | $1.000.000 | 0 / 0 / 0 |
| 2 | 12/07 12:31 | 47 | Compra MARKET · FILLED | 50 × 930 | $953.500 | 50 / 0 / 0 |
| 3 | 12/07 14:21 | 47 | Compra LIMIT · CANCELLED | 50 × 920 | — | — |
| 4 | 12/07 14:51 | 47 | Venta MARKET · FILLED | 10 × 940 | $962.900 | 40 / 0 / 0 |
| 5 | 12/07 15:14 | 45 | Compra LIMIT · NEW | 50 × 710 | — | — |
| 6 | 12/07 16:11 | 47 | Venta MARKET · REJECTED | 100 × 950 | — | — |
| 7 | 13/07 11:13 | 31 | Compra LIMIT · NEW | 60 × 1.500 | — | — |
| 8 | 13/07 12:31 | 66 | Retiro · FILLED | 100.000 × 1 | $862.900 | 40 / 0 / 0 |
| 9 | 13/07 12:51 | 31 | Compra LIMIT · FILLED | 20 × 1.540 | $832.100 | 40 / 20 / 0 |
| 10 | 13/07 14:11 | 54 | Compra MARKET · FILLED | 500 × 250 | $707.100 | 40 / 20 / 500 |
| 11 | 13/07 15:13 | 31 | Venta MARKET · **FILLED** | 30 × 1.530 | **$753.000** | 40 / **−10** / 500 |

**Resultado tal cual vienen los datos:** saldo de $753.000; 40 acciones del instrumento 47, 500 del 54 y **−10 del 31**. El saldo nunca queda negativo, pero la tenencia del 31 sí.

## 3. Qué encontramos

**H1 — Una venta de acciones que no existían (orden 11).** Se venden 30 acciones del instrumento 31 cuando solo se habían comprado 20. Si no había tenencia previa, esa orden debió rechazarse según las propias reglas del challenge. No hay ningún dato que indique que existiera una tenencia anterior.

**H2 — Cada orden tiene una sola fecha.** `datetime` no distingue cuándo se creó la orden de cuándo se ejecutó o se canceló. Por ejemplo, la orden 9 es una LIMIT ejecutada y su fecha puede ser la de creación. Con estos datos no se puede saber cómo fue cambiando el estado de una orden, aunque eso no cambia el −10 final.

**H3 — Las órdenes LIMIT pendientes no comprometen nada.** Mientras una LIMIT está en `NEW`, el saldo sigue entero disponible, así que se podría usar dos veces la misma plata. Hoy pasa con las órdenes 5 ($35.500) y 7 ($90.000).

## 4. Qué proponemos

### 4.1 Corregir la orden 11

En el modelo nuevo la importamos como `REJECTED`. El dato original queda guardado tal cual en `orders_legacy` y el motivo de la corrección se registra aparte. Corregimos el estado y no el tipo de orden, porque convertir la venta en compra cambiaría lo que el usuario pidió.

| | Datos originales | Con la corrección |
|---|---:|---:|
| Saldo total | $753.000 | **$707.100** |
| Instrumento 31 | −10 | **20** (precio promedio $1.540) |
| Comprometido en LIMIT pendientes (órdenes 5 y 7) | $125.500 | $125.500 |
| Disponible para operar | $627.500 | **$581.600** |

**Riesgo que asumimos:** quien calcule sumando todas las órdenes `FILLED` sin mirar nada más va a esperar $753.000. Lo aceptamos porque una tenencia negativa no tiene precio promedio ni valor de mercado que tengan sentido, y porque contradice la regla de rechazo del propio challenge. Para compensarlo, conservamos el dato original y mostramos los dos resultados (ver ADR).

### 4.2 Saldo total, comprometido y disponible

Una compra LIMIT pendiente compromete su importe (cantidad por precio límite) y una venta LIMIT pendiente compromete las acciones. Lo comprometido no baja el saldo total ni el valor de la cuenta; si la orden se cancela, se libera. **Lo disponible para operar es el saldo total menos lo comprometido.** Esto es una regla nueva, no algo que pasara en 2023: lo comprometido por las órdenes 5 y 7 se registra al migrar.

### 4.3 Precio promedio de compra y valorización

- **Precio promedio de compra (PPC):** es el promedio de lo pagado, ponderado por la cantidad de cada compra. Cuando se vende una parte, las acciones que quedan mantienen el mismo PPC; la diferencia entre el precio de venta y el PPC es la ganancia o pérdida realizada. Si la posición llega a cero, el PPC arranca de nuevo con la próxima compra. Descartamos FIFO (vender primero lo que se compró primero) porque obliga a seguir cada compra por separado y no lo necesitamos.
  - *Ejemplo:* comprás 10 acciones a $1.000 y otras 10 a $2.000: el PPC queda en $1.500. Vendés 5 a $1.600 y ganás $500. Si el último precio es $1.800, las 15 que te quedan valen $27.000 y te costaron $22.500: estás **+20 %**.
- **Precio actual:** se toma la cotización más reciente de cada instrumento en `marketdata`. Si un instrumento no tiene cotización, su posición queda sin valorizar y no inventamos un total.
- **Valor de la cuenta:** es el saldo total más lo que valen hoy todas las posiciones, o sea, la cantidad de acciones de cada una por su último precio de cierre (`close`).
- **Rendimiento del día:** compara el último cierre (`close`) con el del día anterior (`previousClose`).
- **Órdenes MARKET:** se ejecutan al último precio de cierre y se validan contra lo disponible para operar.
- Los importes se manejan con decimales exactos (`NUMERIC` en la base), nunca con `float`.

### 4.4 Fechas de las órdenes

Separamos la fecha de creación (`created_at`) de la última modificación (`updated_at`). Las órdenes históricas se importan con las dos fechas iguales a su `datetime` original; lo dejamos documentado y no inventamos cambios de estado. Para las órdenes nuevas alcanza con esas dos fechas: `updatedAt` registra cuándo fue el último cambio de estado.

## 5. ¿Guardar los saldos o reconstruirlos desde los movimientos?

Separar las órdenes de los movimientos de dinero y acciones es necesario en cualquier caso. La pregunta es cuál es la fuente de verdad:

- **Movimientos con saldos guardados:** se registra cada movimiento y además se mantienen actualizadas tablas con el saldo, lo comprometido, las tenencias y el PPC. La verdad es lo que dicen esas tablas.
- **Event Sourcing en la cuenta:** se guardan solo los hechos que ocurrieron (ingresó plata, se ejecutó una compra, se comprometió saldo, se liberó) y el saldo, las tenencias y el PPC se calculan recorriéndolos en orden. Para no recorrer todo cada vez, cada tanto se guarda una foto del estado (*snapshot*) y después solo se aplican los hechos posteriores.

| Criterio | Movimientos con saldos guardados | Event Sourcing en la cuenta |
|---|---|---|
| Complejidad | **Menor** | Mayor: hay que reconstruir el estado y versionar los eventos |
| Auditoría | Buena: se ve cada débito y crédito | Buena: además se ve por qué cambió cada cosa |
| PPC y lo comprometido | Son más datos que hay que mantener al día a mano | **Salen de la misma historia de hechos** |
| Riesgo de que no cierren los números | El saldo guardado puede quedar desfasado de los movimientos | Hay una sola fuente; todo lo demás se recalcula |
| Velocidad de lectura | **Directa** | Última foto más los hechos posteriores: no se vuelve más lenta con el tiempo |
| Operaciones simultáneas | Se resuelve con un bloqueo en PostgreSQL | Igual: Event Sourcing no lo resuelve solo |
| Infraestructura | Solo PostgreSQL | Solo PostgreSQL |

**Recomendación: Event Sourcing solo en la cuenta, con snapshots; las órdenes siguen en una tabla común.** El estado de la cuenta cambia por cuatro motivos (ingresos y retiros, compras y ventas, compromisos y liberaciones) y tiene que dar cinco números: saldo total, comprometido, disponible, tenencias y PPC. Con Event Sourcing los cinco salen de una sola historia y no hay cinco datos que mantener sincronizados. Los snapshots resuelven la principal desventaja, que es tener que recorrer todo desde el principio, sin crear una segunda verdad: son una foto que se puede borrar y volver a generar. Guardar los saldos también funcionaría y sería más simple; elegimos Event Sourcing por consistencia y trazabilidad, no porque sea más rápido.

## 6. Operaciones simultáneas

Si llegan dos órdenes de la misma cuenta al mismo tiempo, las dos pueden leer el mismo saldo y gastarlo dos veces. Evaluamos dos formas de evitarlo:

| Alternativa | A favor | En contra |
|---|---|---|
| **Bloquear la cuenta mientras se opera** (`SELECT … FOR UPDATE`) | Simple: la segunda operación espera y valida con el saldo ya actualizado | Las operaciones de una misma cuenta se procesan de a una |
| Control por versión | No espera si no hay choque | Si hay choque, hay que releer, validar de nuevo y reintentar |

**Recomendamos bloquear la cuenta.** Funciona aunque haya varias instancias de la API usando la misma base. *Ejemplo:* con $100.000 disponibles llegan dos compras de $80.000. La primera se ejecuta; la segunda espera, ve que quedan $20.000 y se rechaza. Si en cambio hay un error técnico (por ejemplo, se agota el tiempo de espera), la API responde con error y la orden no se marca como rechazada.

## 7. Resultado

| Tema | Estado | Siguiente paso |
|---|---|---|
| Saldo y tenencias de las 11 órdenes | **Comprobado** | Usarlos como datos de prueba |
| Inconsistencia de la orden 11 | **Comprobado** (si no había tenencia previa) | Migrar con la corrección documentada |
| Compromiso de LIMIT, PPC y precio de MARKET | Propuesto | ADR-001 |
| Event Sourcing en la cuenta vs. saldos guardados | Comparado; se recomienda Event Sourcing con snapshots | ADR-001 |
| Bloqueo de la cuenta para operaciones simultáneas | Recomendado, todavía sin probar | Prueba de integración |
| Instrumentos sin cotización en `marketdata` | Pendiente | Verificarlo durante el desarrollo |
