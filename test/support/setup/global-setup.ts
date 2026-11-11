// globalSetup corre fuera del entorno de Jest y no aplica moduleNameMapper: los alias de
// tsconfig.json se registran con tsconfig-paths antes de importar código de src/.
import 'tsconfig-paths/register';
import { recreateTestDatabase } from './database';

/** Una vez por corrida: base de prueba limpia con el dataset del challenge y las migraciones. */
export default async function globalSetup(): Promise<void> {
  await recreateTestDatabase();
}
