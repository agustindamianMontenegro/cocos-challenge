/**
 * NestJS 12 se publica como ESM y el proyecto compila a CommonJS.
 * Jest corre en CommonJS, así que esos paquetes pasan por ts-jest con dos ajustes:
 * - `const require = createRequire(import.meta.url)` sobra: en CommonJS `require` ya existe.
 * - `import.meta.url` no existe en CommonJS: se reemplaza por su equivalente.
 */
const { TsJestTransformer } = require('ts-jest');

const CREATE_REQUIRE = /^const require = createRequire\(import\.meta\.url\);$/gm;
const IMPORT_META_URL = /import\.meta\.url/g;
const CJS_URL = "require('node:url').pathToFileURL(__filename).href";

function toCommonJs(source) {
  return source.replace(CREATE_REQUIRE, '').replace(IMPORT_META_URL, CJS_URL);
}

class EsmToCjsTransformer extends TsJestTransformer {
  process(source, path, options) {
    return super.process(toCommonJs(source), path, options);
  }

  processAsync(source, path, options) {
    return super.processAsync(toCommonJs(source), path, options);
  }

  getCacheKey(source, path, options) {
    return super.getCacheKey(toCommonJs(source), path, options);
  }
}

module.exports = {
  createTransformer: (config) => new EsmToCjsTransformer(config),
};
