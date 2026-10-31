// Coding guide 1.4 (docs/07-coding-guide).
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const configFiles = ['**/*.config.{js,ts,cjs,mjs}', '**/.dependency-cruiser.cjs'];

// Tool config files use a default export; the rule is turned off for them below.
export default tseslint.config(
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/coverage/',
      '**/test-results/',
      '**/playwright-report/',
      'packages/fonts/assets/',
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Coding guide 4: `type` by default, `ReadonlyArray<T>` for model fields.
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/array-type': ['error', { default: 'array', readonly: 'generic' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      eqeqeq: 'error',
      'no-console': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Use named exports only (coding guide 3.2).',
        },
      ],
    },
  },
  {
    files: ['packages/editor/**/*.{ts,tsx}', 'apps/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.bench.ts', '**/e2e/**', '**/scripts/**'],
    rules: { 'no-console': 'off' },
  },
  {
    // Tool config files must use a default export.
    files: configFiles,
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
);
