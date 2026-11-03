// Vite's `?url` imports (vite/client declares the same; this package does not depend on Vite).
declare module '*?url' {
  const url: string;
  // eslint-disable-next-line no-restricted-syntax -- mirrors the default export Vite gives `?url` imports.
  export default url;
}

// Vite's `import.meta.glob`, as far as this package uses it (eager `?url` imports).
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- merges into the global ImportMeta.
interface ImportMeta {
  glob<T>(
    pattern: string,
    options: { readonly query: '?url'; readonly import: 'default'; readonly eager: true },
  ): Record<string, T>;
}
