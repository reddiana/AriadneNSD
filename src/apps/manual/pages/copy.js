/* global document, window -- runs in the browser (the user guide page) */
// The copy buttons of the user guide (R-WEB-11, UX RQ1): a button with `data-copy="<id>"` copies
// the text of the element with that id, as it reads on the page (○○ included), and says so on the
// button for a moment. Where the clipboard is refused, the text is selected to copy by hand.
for (const button of document.querySelectorAll('button[data-copy]')) {
  const label = button.textContent;
  button.addEventListener('click', async () => {
    const source = document.getElementById(button.dataset.copy ?? '');
    if (source === null) return;
    const text = source.textContent.replace(/\s+/g, ' ').trim();
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = button.dataset.copied ?? label;
      setTimeout(() => {
        button.textContent = label;
      }, 1600);
    } catch {
      // No clipboard (an old browser, or permission refused): select it for Ctrl+C.
      const range = document.createRange();
      range.selectNodeContents(source);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  });
}

// The video tabs of the tour (keyboard only · mouse only, M73): one video shows at a time; switching
// pauses the hidden one. Arrow keys move between the tabs (WAI-ARIA tabs pattern).
for (const list of document.querySelectorAll('.videos [role="tablist"]')) {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const select = (tab) => {
    for (const other of tabs) {
      const on = other === tab;
      other.setAttribute('aria-selected', String(on));
      other.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(other.getAttribute('aria-controls') ?? '');
      if (panel === null) continue;
      panel.hidden = !on;
      if (!on) panel.querySelector('video')?.pause();
    }
  };
  for (const tab of tabs) {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (step === undefined) return;
      event.preventDefault();
      const next = tabs[(tabs.indexOf(tab) + step + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  }
}
