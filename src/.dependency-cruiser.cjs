// Coding guide 1.5 (docs/07-coding-guide), architecture 3.3.
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'core-is-pure',
      comment: 'core must not depend on editor, apps, React, or browser-only modules (QA-14).',
      severity: 'error',
      from: { path: '^packages/core/' },
      to: {
        // Unresolvable names are listed too: core does not declare these, so they do not resolve.
        path: [
          '^packages/editor/',
          '^apps/',
          '^@ariadne-nsd/(editor|web)',
          '(^|node_modules/)(@types/)?(react|react-dom)(/|$)',
        ],
      },
    },
    {
      name: 'core-no-node-builtins',
      comment: 'core runs in browsers as well as Node, so it must not use Node built-ins.',
      severity: 'error',
      from: { path: '^packages/core/src/', pathNot: '\\.(test|bench)\\.ts$' },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'fonts-is-data',
      comment: 'fonts must not depend on our other packages.',
      severity: 'error',
      from: { path: '^packages/fonts/' },
      to: { path: ['^packages/(core|editor)/', '^apps/', '^@ariadne-nsd/'] },
    },
    {
      name: 'editor-no-shell',
      comment: 'editor must not depend on any shell (apps/*).',
      severity: 'error',
      from: { path: '^packages/editor/' },
      to: { path: ['^apps/', '^@ariadne-nsd/web'] },
    },
    {
      name: 'apps-independent',
      comment: 'An app must not depend on another app.',
      severity: 'error',
      from: { path: '^apps/([^/]+)/' },
      to: { path: '^apps/', pathNot: '^apps/$1/' },
    },
    {
      name: 'no-unresolvable',
      comment: 'Every import must resolve, so the rules above see real paths.',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-deep-import',
      comment: 'Import another package only through its index.ts (coding guide 3.2).',
      severity: 'error',
      from: { path: '^(packages|apps)/([^/]+)/' },
      to: {
        path: '^packages/([^/]+)/src/',
        pathNot: ['^packages/$2/src/', '^packages/[^/]+/src/index\\.ts$'],
      },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: ['/dist/', '/node_modules/'] },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'default'],
      extensions: ['.ts', '.tsx', '.js', '.json'],
    },
    combinedDependencies: true,
  },
};
