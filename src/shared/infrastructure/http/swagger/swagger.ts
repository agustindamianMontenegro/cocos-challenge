import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const DOCS_PATH = '/docs';

/** Archivos de swagger-ui-dist que necesita la página, con su tipo de contenido. */
const ASSETS: Readonly<Record<string, string>> = {
  'swagger-ui.css': 'text/css; charset=utf-8',
  'swagger-ui-bundle.js': 'application/javascript; charset=utf-8',
  'favicon-32x32.png': 'image/png',
};

const PAGE = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Cocos Challenge API</title>
    <link rel="icon" href="${DOCS_PATH}/favicon-32x32.png" />
    <link rel="stylesheet" href="${DOCS_PATH}/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${DOCS_PATH}/swagger-ui-bundle.js"></script>
    <script>window.ui = SwaggerUIBundle({ url: '${DOCS_PATH}-json', dom_id: '#swagger-ui' });</script>
  </body>
</html>`;

/**
 * Publica el contrato OpenAPI en /docs-json y la interfaz de Swagger en /docs.
 * Con Fastify, la interfaz de @nestjs/swagger exige @fastify/static; para no sumar
 * esa dependencia, se sirven directamente los tres archivos de swagger-ui-dist.
 */
export function setupSwagger(app: NestFastifyApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Cocos Challenge API')
    .setDescription('Portfolio, búsqueda de instrumentos y órdenes MARKET y LIMIT. Ver docs/ADR-001_Arquitectura.md.')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup(DOCS_PATH, app, () => SwaggerModule.createDocument(app, config), { ui: false });
  serveSwaggerUi(app);
}

function serveSwaggerUi(app: NestFastifyApplication): void {
  const fastify = app.getHttpAdapter().getInstance();
  const assetsDir = swaggerUiDistPath();
  fastify.get(DOCS_PATH, async (_request, reply) => reply.type('text/html; charset=utf-8').send(PAGE));
  Object.entries(ASSETS).forEach(([file, contentType]) => {
    fastify.get(`${DOCS_PATH}/${file}`, async (_request, reply) =>
      reply.type(contentType).send(await readFile(join(assetsDir, file))),
    );
  });
}

/** swagger-ui-dist llega como dependencia de @nestjs/swagger. */
function swaggerUiDistPath(): string {
  return dirname(require.resolve('swagger-ui-dist/package.json'));
}
