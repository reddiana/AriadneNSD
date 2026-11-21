// Plain object on purpose: this folder has no node_modules to resolve `vitest/config` from.
export default {
  root: new URL('../../../packages/editor/', import.meta.url).pathname.replace(
    /^\/([A-Za-z]:)/,
    '$1',
  ),
  test: { environment: 'node', globals: true, include: ['../../apps/gallery/verify/*.script.ts'] },
};
