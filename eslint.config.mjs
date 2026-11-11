import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';

// ---------- Reglas de arquitectura (hexagonal + monolito modular) ----------

const MODULE_NAMES = ['account', 'market', 'trading', 'portfolio', 'migration'];

/** Fuera de la carpeta actual se importa con alias (@shared, @modules, @test…), nunca con ../ */
const NO_PARENT_IMPORTS = {
  regex: '^\\.\\./',
  message: 'Usá los alias (@shared/…, @modules/…, @test/…) en lugar de rutas con ../',
};

const FRAMEWORKS = {
  regex: '^@nestjs/|^typeorm$|^typeorm/',
  message: 'Esta capa no depende de NestJS ni de TypeORM.',
};

/** Un módulo solo puede usar de otro sus puertos de entrada (application/ports/in). */
const otherModuleInternals = (own) => ({
  regex: `^@modules/(?!${own}/)[^/]+/(domain|infrastructure|application/(?!ports/in/))`,
  message: 'Entre módulos solo se usan los puertos de entrada (application/ports/in) del otro módulo.',
});

const restrict = (...patterns) => ['error', { patterns: [NO_PARENT_IMPORTS, ...patterns] }];

const lintTs = (files) => ({ files, ignores: ['**/*.spec.ts'] });

// El dominio es puro: ni frameworks, ni aplicación, ni infraestructura, ni otros módulos.
const domainRules = (base, cross) => ({
  ...lintTs([`${base}/domain/**/*.ts`]),
  rules: {
    'no-restricted-imports': restrict(
      FRAMEWORKS,
      { regex: '/(application|infrastructure)/', message: 'El dominio no depende de la aplicación ni de la infraestructura.' },
      { ...cross.domain, message: 'El dominio no depende de otros módulos.' },
    ),
  },
});

// La aplicación depende del dominio y de puertos; nunca de adaptadores.
const applicationRules = (base, cross) => ({
  ...lintTs([`${base}/application/**/*.ts`]),
  rules: {
    'no-restricted-imports': restrict(
      FRAMEWORKS,
      { regex: '/infrastructure/', message: 'La aplicación no depende de la infraestructura: usá un puerto de salida.' },
      cross.internals,
    ),
  },
});

// Los adaptadores HTTP solo conocen puertos de entrada.
const httpRules = (base, cross) => ({
  ...lintTs([`${base}/infrastructure/http/**/*.ts`]),
  rules: {
    'no-restricted-imports': restrict(
      { regex: '^typeorm$|^typeorm/|/persistence/', message: 'Un adaptador HTTP no accede a la base.' },
      {
        regex: '/application/(use-cases|ports/out|services|mappers|types|errors)/',
        message: 'Un adaptador HTTP solo depende de puertos de entrada (application/ports/in).',
      },
      cross.internals,
    ),
  },
});

const adapterRules = (base, cross) => ({
  ...lintTs([`${base}/infrastructure/persistence/**/*.ts`, `${base}/infrastructure/cli/**/*.ts`, `${base}/*.module.ts`]),
  rules: { 'no-restricted-imports': restrict(cross.internals) },
});

/** Reglas por capa de un módulo (o de shared, que no puede depender de ningún módulo). */
const layerRules = (base, cross) => [domainRules, applicationRules, httpRules, adapterRules].map((rule) => rule(base, cross));

const MODULE_RULES = MODULE_NAMES.flatMap((name) =>
  layerRules(`src/modules/${name}`, {
    domain: { regex: `^@modules/(?!${name}/)` },
    internals: otherModuleInternals(name),
  }),
);

const SHARED_RULES = layerRules('src/shared', {
  domain: { regex: '^@modules/' },
  internals: { regex: '^@modules/', message: 'shared no depende de ningún módulo.' },
});

const TYPE = 'ExportNamedDeclaration:has(> :matches(TSInterfaceDeclaration, TSTypeAliasDeclaration))';
const CODE = 'ExportNamedDeclaration:has(> :matches(ClassDeclaration, FunctionDeclaration, VariableDeclaration))';

/** Cada interfaz o tipo exportado vive en su propio archivo, separado del código. */
const ONE_TYPE_PER_FILE = {
  files: ['src/**/*.ts'],
  ignores: ['**/*.spec.ts', '**/*.types.ts'],
  rules: {
    'no-restricted-syntax': [
      'error',
      { selector: `${TYPE} ~ ${TYPE}`, message: 'Una interfaz o tipo por archivo.' },
      { selector: `${TYPE} ~ ${CODE}`, message: 'Las interfaces y tipos van en un archivo aparte del código.' },
      { selector: `${CODE} ~ ${TYPE}`, message: 'Las interfaces y tipos van en un archivo aparte del código.' },
      { selector: 'Program > TSInterfaceDeclaration', message: 'Las interfaces van en su propio archivo.' },
    ],
    'max-classes-per-file': ['error', 1],
  },
};

/** Un `*.types.ts` agrupa uniones y alias chicos: varios tipos, pero ni interfaces ni código. */
const GROUPED_TYPES = {
  files: ['src/**/*.types.ts'],
  rules: {
    'no-restricted-syntax': [
      'error',
      { selector: 'TSInterfaceDeclaration', message: 'Un *.types.ts solo agrupa alias de tipo; las interfaces van en su propio archivo.' },
      { selector: CODE, message: 'Un *.types.ts no lleva código.' },
    ],
  },
};

const ARCHITECTURE = [
  // Base para todo src/ y test/; los bloques por capa la repiten y suman sus reglas.
  { files: ['src/**/*.ts', 'test/**/*.ts'], rules: { 'no-restricted-imports': restrict() } },
  ...MODULE_RULES,
  ...SHARED_RULES,
  ONE_TYPE_PER_FILE,
  GROUPED_TYPES,
];

/**
 * Reglas de complejidad: el lint falla si un método se complica,
 * lo escriba quien lo escriba. Las de arquitectura, si se cruza una capa.
 */
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { sonarjs },
    rules: {
      complexity: ['error', 8],
      'sonarjs/cognitive-complexity': ['error', 10],
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Archivos de configuración en CommonJS (jest.config.js).
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { module: 'writable', require: 'readonly', __filename: 'readonly' },
    },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  ...ARCHITECTURE,
  {
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    rules: { 'max-lines-per-function': 'off' },
  },
);
