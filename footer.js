// footer.js — Footer component
// ES module: exports a default footer component.

/**
 * Footer component.
 * Returns an HTML footer element containing copyright text.
 * All styles are applied inline.
 *
 * @returns {HTMLElement}
 */
export default function Footer() {
  const footer = document.createElement('footer');

  footer.style.display = 'block';
  footer.style.width = '100%';
  footer.style.padding = '16px 0';
  footer.style.textAlign = 'center';
  footer.style.fontSize = '14px';
  footer.style.fontFamily = 'monospace, sans-serif';
  footer.style.color = '#cccccc';
  footer.style.backgroundColor = '#111111';
  footer.style.marginTop = 'auto';

  footer.textContent = '\u00A9 2025 Paw Experiences';

  return footer;
}
