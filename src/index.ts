const CHAR_WIDTH_PX = 6.5;
const HALF_PADDING_PX = 10;
const HEIGHT_PX = 20;
const CORNER_RADIUS_PX = 3;
const LABEL_COLOUR = '#555';
const DEFAULT_MESSAGE_COLOUR = '#4c1';

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function halfWidth(text: string): number {
  return CHAR_WIDTH_PX * text.length + HALF_PADDING_PX;
}

export function badge(label: string, message: string, colour: string = DEFAULT_MESSAGE_COLOUR): string {
  const labelWidth = halfWidth(label);
  const messageWidth = halfWidth(message);
  const totalWidth = labelWidth + messageWidth;
  const escapedLabel = escapeText(label);
  const escapedMessage = escapeText(message);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${HEIGHT_PX}">
  <clipPath id="round">
    <rect width="${totalWidth}" height="${HEIGHT_PX}" rx="${CORNER_RADIUS_PX}"/>
  </clipPath>
  <g clip-path="url(#round)">
    <rect width="${labelWidth}" height="${HEIGHT_PX}" fill="${LABEL_COLOUR}"/>
    <rect x="${labelWidth}" width="${messageWidth}" height="${HEIGHT_PX}" fill="${colour}"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="14">${escapedLabel}</text>
    <text x="${labelWidth + messageWidth / 2}" y="14">${escapedMessage}</text>
  </g>
</svg>`;
}
