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
