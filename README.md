# Cocos Challenge — Backend

API de un broker de inversiones. Permite ver el portfolio de un usuario, buscar instrumentos, enviar órdenes de compra y venta (MARKET y LIMIT) y cancelar las LIMIT pendientes.

**Stack:** NestJS sobre Fastify, TypeScript, PostgreSQL y TypeORM.

- [Cómo levantarlo](#cómo-levantarlo)
- [Cómo probarlo](#cómo-probarlo)
- [Arquitectura](#arquitectura)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Pruebas](#pruebas)
- [Comandos](#comandos)
- [Si algo no funciona](#si-algo-no-funciona)
- [Documentación del diseño](#documentación-del-diseño)

---

## Cómo levantarlo

**Necesitás** Node.js 22.12 o superior y PostgreSQL: levantalo con Docker o, si ya tenés una base, apuntá el `.env` a ella.

```bash
npm install
cp .env.example .env      # configuración; ya apunta a la base de Docker
npm run db:up             # levanta PostgreSQL en Docker con los datos del challenge
npm run db:setup          # crea las tablas nuevas y migra las órdenes históricas
npm run start:dev         # arranca la API en http://localhost:3000
```

Listo: abrí **http://localhost:3000/portfolio/1** y deberías ver el portfolio del usuario 1, con $707.100 de saldo.

Las próximas veces alcanza con `npm run db:up` (si la base no está corriendo) y `npm run start:dev`.

---

## Cómo probarlo

- **Swagger:** http://localhost:3000/docs. Documentación interactiva: podés probar cada endpoint desde el navegador.
- **Postman:** importá `cocos-challenge.postman_collection.json`, en la raíz del proyecto. Trae todos los casos, cada pedido verifica su respuesta y se puede correr completa con *Run collection*.
- **VS Code:** `requests.http`, con la extensión REST Client.

| Endpoint | Qué hace |
|---|---|
| `GET /portfolio/:userId` | Valor total, plata disponible y comprometida, y cada posición con precio promedio, valor actual y resultado. |
| `GET /instruments?search=texto` | Busca instrumentos por ticker o nombre, con su último precio. |
| `POST /orders` | Envía una orden MARKET o LIMIT, por cantidad de acciones (`size`) o por monto (`amount`). |
| `PATCH /orders/:id/cancel` | Cancela una LIMIT pendiente y libera lo que tenía reservado. |

Por ejemplo, para comprar 10 acciones de PAMP (instrumento 47) al precio de mercado:

```bash
curl -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{
  "orderId": "01934f7a-2b6c-7d2e-9a10-5c3e8f7b1a42",
  "userId": 1, "instrumentId": 47, "side": "BUY", "type": "MARKET", "size": 10
}'
```

Para tener en cuenta:

- **El `orderId` lo genera el cliente** y tiene que ser un UUID v7. Si se reenvía el mismo pedido, la API devuelve la orden ya creada y no la ejecuta dos veces.
- **Una orden sin saldo o sin acciones suficientes no es un error:** se guarda con estado `REJECTED` y el motivo.
- **Las MARKET se ejecutan al último precio de cierre.** Las LIMIT quedan en `NEW` y reservan la plata o las acciones hasta que se cancelan.
- **Los montos viajan como texto** (`"707100.00"`), para no perder precisión.
- **Los errores** tienen siempre la forma `{ "error": { "code": "...", "message": "..." } }`.

### Campos

Los montos y porcentajes van como texto con dos decimales. Un campo en `null` significa que no hay datos para calcularlo (por ejemplo, un instrumento sin cotización): la API no inventa valores.

**`GET /portfolio/:userId`**

| Campo | Qué es |
|---|---|
| `userId`, `accountNumber` | El usuario y su número de cuenta. |
| `totalValue` | Valor total de la cuenta: el saldo más lo que valen hoy todas las posiciones. `null` si alguna posición no tiene precio. |
| `valuationComplete` | `true` si se pudieron valuar todas las posiciones. |
| `balance.total` | Pesos de la cuenta, incluidos los reservados. |
| `balance.reserved` | Pesos reservados por compras LIMIT pendientes. |
| `balance.available` | Pesos disponibles para operar: `total − reserved`. |
| `positions[].instrumentId`, `ticker`, `name` | El instrumento. |
| `positions[].quantity` | Cantidad de acciones. |
| `positions[].averagePrice` | Precio promedio de compra. |
| `positions[].lastPrice` | Último precio de cierre. |
| `positions[].marketValue` | Valor actual de la posición: `quantity × lastPrice`. |
| `positions[].totalReturnPct` | Resultado de la posición en %: cuánto ganó o perdió respecto de lo que costó (`marketValue / (quantity × averagePrice) − 1`). |
| `positions[].dailyReturnPct` | Variación diaria del precio en %: último cierre contra el anterior. Es un dato adicional. |

**`GET /instruments?search=texto`**

| Campo | Qué es |
|---|---|
| `search` (query) | Texto a buscar en el ticker o el nombre, sin distinguir mayúsculas. Obligatorio. |
| `id`, `ticker`, `name`, `type` | El instrumento y su tipo (por ejemplo, `ACCIONES`). |
| `lastPrice` | Último precio de cierre. |
| `previousClose` | Cierre del día anterior. |
| `dailyReturnPct` | Variación diaria del precio en %. |

**`POST /orders` — pedido**

| Campo | Qué es |
|---|---|
| `orderId` | Identificador de la orden, generado por el cliente (UUID v7). Reenviar el mismo pedido no lo ejecuta dos veces. |
| `userId` | Usuario que opera. |
| `instrumentId` | Instrumento a comprar o vender. |
| `side` | `BUY` (compra) o `SELL` (venta). |
| `type` | `MARKET` (al último precio de cierre) o `LIMIT` (a un precio fijado). |
| `size` | Cantidad de acciones. Se manda `size` o `amount`, no los dos. |
| `amount` | Monto en pesos a invertir. La API calcula cuántas acciones entran, redondeando hacia abajo. |
| `price` | Precio límite. Obligatorio en las LIMIT y prohibido en las MARKET. |

**`POST /orders` y `PATCH /orders/:id/cancel` — respuesta**

| Campo | Qué es |
|---|---|
| `id` | El `orderId` de la orden. |
| `userId`, `instrumentId`, `side`, `type` | Igual que en el pedido. |
| `size` | Cantidad de acciones (la calculada, si se mandó `amount`). |
| `price` | Precio de ejecución en las MARKET; precio límite en las LIMIT. |
| `status` | `FILLED` (ejecutada), `NEW` (LIMIT pendiente), `REJECTED` (rechazada) o `CANCELLED` (cancelada). |
| `rejectionReason` | Por qué se rechazó: `INSUFFICIENT_FUNDS` (falta plata) o `INSUFFICIENT_SHARES` (faltan acciones). `null` si no se rechazó. |
| `createdAt`, `updatedAt` | Fecha de creación y de la última modificación. |

---

## Arquitectura

- **Monolito modular.** Una sola aplicación dividida en cinco módulos de negocio:

  | Módulo | Qué hace |
  |---|---|
  | Trading | órdenes |
  | Account | la cuenta de cada usuario |
  | Market | instrumentos y precios |
  | Portfolio | la vista del portfolio |
  | Migration | importa las órdenes históricas |
- **Arquitectura hexagonal.** Cada módulo separa las reglas de negocio (dominio) de los casos de uso (aplicación) y de los detalles técnicos (infraestructura: HTTP, base de datos). El negocio no depende de NestJS ni de TypeORM, y el lint impide romper esa regla.
- **Los módulos se hablan por interfaces.** Por ejemplo, Trading le pide a Account que reserve fondos, pero nunca toca la cuenta ni sus tablas directamente.
- **Event Sourcing en la cuenta.** El saldo, las tenencias y el precio promedio se calculan a partir de los movimientos de la cuenta, que nunca se modifican. Cada 100 movimientos se guarda una foto del estado, para no recorrer toda la historia.
- **Sin carreras.** Cada orden es una transacción con la cuenta bloqueada: dos compras simultáneas no pueden gastar la misma plata.
- **Dinero exacto.** Se usa `NUMERIC` en la base y `decimal.js` en el código, nunca `float`.

---

## Estructura de carpetas

```
src/
  modules/              un módulo por área de negocio
    trading/
    account/
    market/
    portfolio/
    migration/
  shared/               lo común a todos los módulos (dinero, errores, HTTP, transacciones)
  database/             conexión de TypeORM y migraciones de la base
  main.ts               arranque de la API
test/                   pruebas de integración y dobles para las unitarias
database/               database.sql original del challenge
docs/                   ADR y spike técnico
```

Todos los módulos tienen la misma forma:

```
trading/
  domain/               reglas de negocio puras: entidades, objetos de valor y errores
  application/
    ports/in/           lo que el módulo ofrece (casos de uso)
    ports/out/          lo que el módulo necesita (repositorios)
    use-cases/          la implementación de los casos de uso
  infrastructure/
    http/               controllers y DTOs
    persistence/        repositorios y mapeo de tablas con TypeORM
  trading.module.ts     conecta los puertos con sus implementaciones
```

---

## Pruebas

Hay 199 pruebas, de dos tipos:

**Unitarias (135) — `npm test`.** Prueban la lógica sin base de datos ni servidor, así que corren en un segundo en cualquier máquina. Están junto al código que prueban (`*.spec.ts`) y cubren:

- **Reglas de negocio:** saldo, reservas, compras y ventas de la cuenta; precio promedio de compra; estados de una orden; valuación del portfolio y porcentajes; validaciones de los pedidos.
- **Casos de uso:** enviar y cancelar órdenes, consultar el portfolio, buscar instrumentos y migrar los datos. Usan versiones en memoria de los repositorios (en `test/support/doubles/`) en lugar de la base real.

**Integración (64) — `npm run test:integration`.** Levantan la API completa y la prueban con pedidos HTTP reales contra PostgreSQL. Están en `test/*.e2e-spec.ts`:

| Archivo | Qué prueba |
|---|---|
| `orders.e2e-spec.ts` | El envío de órdenes, que es el test funcional que pide el challenge: MARKET y LIMIT, por cantidad y por monto, rechazos por falta de plata o de acciones, cancelación, reintentos y validaciones. Incluye dos compras simultáneas de $80.000 con $100.000 de saldo: una se ejecuta y la otra se rechaza. |
| `account-repository.e2e-spec.ts` | La cuenta en la base: bloqueo con operaciones simultáneas, fotos periódicas del estado y que un error deshaga toda la transacción. |
| `migration.e2e-spec.ts` | La migración de las órdenes históricas: el resultado esperado del usuario 1, la corrección de la orden 11 y que se pueda correr dos veces sin duplicar nada. |
| `portfolio.e2e-spec.ts`, `instruments.e2e-spec.ts` | La valuación del portfolio y la búsqueda, incluido un instrumento sin cotización. |

Las pruebas de integración usan una base propia (`TEST_DATABASE_URL`, por defecto `cocos_test`) que **se vacía y se recarga en cada corrida**, así que nunca tocan tus datos. Con Docker se crea sola; si no, alcanza con crear una base vacía y apuntar esa variable a ella.

`npm run test:all` corre las dos.

---

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run start:dev` | Arranca la API en modo desarrollo. |
| `npm run build` y `npm start` | Compila y corre la API como en producción. |
| `npm run db:up` / `db:down` | Levanta o apaga la base en Docker. Los datos se conservan. |
| `npm run db:setup` | Aplica las migraciones y migra las órdenes históricas. Se puede repetir sin problema. |
| `npm run db:reset` | Borra la base de Docker y la recrea desde cero (después, `db:setup`). |
| `npm test` | Pruebas unitarias. No necesitan base. |
| `npm run test:integration` | Pruebas contra PostgreSQL real, sobre una base aparte (`cocos_test`). |
| `npm run test:all` | Todas las pruebas. Conviene correrla antes de subir cambios. |
| `npm run lint` / `typecheck` | Revisan el estilo, las reglas de arquitectura y los tipos. |

---

## Si algo no funciona

| Qué ves | Qué hacer |
|---|---|
| `address already in use` | Otro PostgreSQL usa el puerto 5432. Poné `DB_PORT=5433` en el `.env` y cambiá el puerto en las URL. |
| `ECONNREFUSED` al arrancar | La base no está corriendo o el `.env` apunta a otro puerto. Corré `npm run db:up` y revisá las URL. |
| El portfolio del usuario 1 sale vacío | Falta `npm run db:setup`. |

---

## Documentación del diseño

Antes de programar se hizo un análisis y se tomaron las decisiones de arquitectura por escrito. Están en `docs/`:

- **Spike técnico:** analiza los datos originales del challenge y encuentra sus problemas. Por ejemplo, la orden 11 vende acciones que el usuario no tenía, y las LIMIT pendientes no reservaban plata.
- **ADR (Architecture Decision Record):** registra la decisión de arquitectura: qué se eligió (monolito modular, Event Sourcing en la cuenta, reserva de fondos en las LIMIT, bloqueo por cuenta), qué alternativas se descartaron y por qué, y cómo se migran los datos.

---

## Fuera de alcance

- **Autenticación:** en un producto real habría que verificar que el `userId` sea el del usuario logueado.
- **Ejecución automática de las LIMIT:** hoy quedan pendientes hasta que se cancelan.
- **Depósitos y retiros por la API:** solo existen los movimientos históricos migrados.
