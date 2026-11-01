// The examples modal (R-EDIT-25, 05-screen-layout "예제", UX EX2 · EX3): ten examples, then
// "blank document" and "open file…", on a 4 × 3 grid. It welcomes a first-time visitor once and
// also opens from the toolbar's "예제" and Help › Examples…, with other words at the top.

import type { Locale } from '@ariadne-nsd/core';
import { renderDoc } from '@ariadne-nsd/core';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import type { ExampleInfo } from '../examples/examples';
import { Modal } from './modals';
import { useChrome } from './use-engine';

/** Why the modal is open: the first visit (a welcome), or the toolbar · Help › Examples…. */
export type ExamplesMode = 'welcome' | 'menu';

/** A drawing of an example, scaled into its card by the SVG's own viewBox. */
function Thumbnail({
  example,
  locale,
}: {
  readonly example: ExampleInfo;
  readonly locale: Locale;
}) {
  const svg = useMemo(() => renderDoc(example.build('title'), { locale }).svg, [example, locale]);
  return (
    <span className="ans-example-thumb">
      <svg
        viewBox={svg.viewBox}
        role="img"
        aria-hidden="true"
        // The drawing is our own renderer's output: escaped text, no scripts (ADR-0030).
        dangerouslySetInnerHTML={{
          __html: `<rect width="100%" height="100%" fill="${svg.paper}"/>${svg.content}`,
        }}
      />
    </span>
  );
}

export function ExamplesModal({
  mode,
  examples,
  onExample,
  onBlank,
  onOpenFile,
  onClose,
}: {
  readonly mode: ExamplesMode;
  readonly examples: ReadonlyArray<ExampleInfo>;
  readonly onExample: (id: string) => void;
  readonly onBlank: () => void;
  readonly onOpenFile: () => void;
  readonly onClose: () => void;
}): ReactElement {
  const { locale, text } = useChrome();
  const isWelcome = mode === 'welcome';
  return (
    <Modal
      title={text(isWelcome ? 'examples.welcomeTitle' : 'examples.menuTitle')}
      onClose={onClose}
    >
      <p className="ans-note">{text(isWelcome ? 'examples.welcomeLead' : 'examples.menuLead')}</p>
      <div className="ans-example-grid">
        {examples.map((example, index) => (
          <button
            key={example.id}
            type="button"
            className="ans-example-card"
            data-example={example.id}
            onClick={() => {
              onExample(example.id);
            }}
          >
            <Thumbnail example={example} locale={locale} />
            <span className="ans-example-name">
              <span className="ans-example-no">{index + 1}</span>
              {example.name[locale]}
            </span>
            <span className="ans-example-what">{example.what[locale]}</span>
          </button>
        ))}
        <button type="button" className="ans-example-card" data-example="blank" onClick={onBlank}>
          <span className="ans-example-thumb ans-example-plain" aria-hidden="true">
            +
          </span>
          <span className="ans-example-name">
            {text(isWelcome ? 'examples.blankWelcome' : 'examples.blank')}
          </span>
          <span className="ans-example-what">
            {text(isWelcome ? 'examples.blankWelcomeWhat' : 'examples.blankWhat')}
          </span>
        </button>
        <button type="button" className="ans-example-card" data-example="open" onClick={onOpenFile}>
          <span className="ans-example-thumb ans-example-plain" aria-hidden="true">
            ↥
          </span>
          <span className="ans-example-name">{text('examples.openFile')}</span>
          <span className="ans-example-what">.ns.svg · .ns</span>
        </button>
      </div>
      {isWelcome && <p className="ans-note ans-example-foot">{text('examples.welcomeFoot')}</p>}
    </Modal>
  );
}
