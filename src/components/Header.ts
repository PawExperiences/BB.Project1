/**
 * Header.ts
 * Factory module that creates a fixed sticky header banner for the application.
 */

/**
 * createHeader()
 * Returns a fully constructed HTMLElement representing the application header.
 * The element is styled inline to be fixed at the top of the viewport.
 */
export function createHeader(): HTMLElement {
  const header = document.createElement('header');

  // Application / game name
  const title = document.createTextNode('Space Invaders');
  header.appendChild(title);

  // Inline styles — no external stylesheet dependency
  header.style.position = 'fixed';
  header.style.top = '0';
  header.style.left = '0';
  header.style.width = '100%';
  header.style.zIndex = '1000';
  header.style.backgroundColor = '#1a1a2e';
  header.style.color = '#00ff88';
  header.style.padding = '12px 24px';
  header.style.fontFamily = 'monospace, monospace';
  header.style.fontSize = '1.25rem';
  header.style.fontWeight = 'bold';
  header.style.boxSizing = 'border-box';

  return header;
}

export default createHeader;
