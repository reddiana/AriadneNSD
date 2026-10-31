// Vite's `?url` imports (vite/client declares the same; this package does not depend on Vite).
declare module '*?url' {
  const url: string;
  // eslint-disable-next-line no-restricted-syntax -- mirrors the default export Vite gives `?url` imports.
  export default url;
}
