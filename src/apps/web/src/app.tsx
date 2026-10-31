import { blockFont } from '@ariadne-nsd/fonts';

import { appTitle } from './app-title';

/** The web shell. Empty for now: the editor comes in later steps. */
export function App() {
  return (
    <main>
      <h1 style={{ fontFamily: `'${blockFont.familyName}', monospace` }}>{appTitle}</h1>
    </main>
  );
}
