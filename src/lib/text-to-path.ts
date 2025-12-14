import opentype from "opentype.js";

let cachedFont: opentype.Font | null = null;

const FONT_URL = "https://cdn.jsdelivr.net/npm/inter-font@3.19.0/ttf/Inter-SemiBold.ttf";

async function loadFont(): Promise<opentype.Font> {
  if (cachedFont) return cachedFont;

  const response = await fetch(FONT_URL);
  const arrayBuffer = await response.arrayBuffer();
  cachedFont = opentype.parse(arrayBuffer);
  return cachedFont;
}

export interface CurvedTextOptions {
  text: string;
  centerX: number;
  centerY: number;
  radius: number;
  fontSize: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
}

export async function textToPathOnArc(options: CurvedTextOptions): Promise<string> {
  const {
    text,
    centerX,
    centerY,
    radius,
    fontSize,
    startAngle = Math.PI,
    endAngle = 0,
    fill = "#000000",
  } = options;

  const font = await loadFont();
  const scale = fontSize / font.unitsPerEm;

  const glyphs: { glyph: opentype.Glyph; advanceWidth: number }[] = [];
  let totalWidth = 0;

  for (let i = 0; i < text.length; i++) {
    const glyph = font.charToGlyph(text[i]);
    const advanceWidth = (glyph.advanceWidth || 0) * scale;
    glyphs.push({ glyph, advanceWidth });
    totalWidth += advanceWidth;
  }

  const textArcAngle = (totalWidth / radius);
  const midAngle = (startAngle + endAngle) / 2;
  let currentAngle = midAngle + textArcAngle / 2;

  const pathElements: string[] = [];

  for (const { glyph, advanceWidth } of glyphs) {
    const charArcAngle = advanceWidth / radius;
    const charCenterAngle = currentAngle - charArcAngle / 2;

    const x = centerX + radius * Math.cos(charCenterAngle);
    const y = centerY - radius * Math.sin(charCenterAngle);

    const rotation = -(charCenterAngle - Math.PI / 2) * (180 / Math.PI);

    const glyphPath = glyph.getPath(0, 0, fontSize);
    const pathData = glyphPath.toPathData(2);

    if (pathData && pathData.length > 0) {
      const ascender = font.ascender * scale;

      pathElements.push(
        `<path d="${pathData}" fill="${fill}" transform="translate(${x}, ${y}) rotate(${rotation}) translate(${-advanceWidth / 2}, ${ascender * 0.35})"/>`
      );
    }

    currentAngle -= charArcAngle;
  }

  return pathElements.join("\n    ");
}

export interface StraightTextOptions {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fill?: string;
  textAnchor?: "start" | "middle" | "end";
}

export async function textToPath(options: StraightTextOptions): Promise<string> {
  const {
    text,
    x,
    y,
    fontSize,
    fill = "#000000",
    textAnchor = "middle",
  } = options;

  const font = await loadFont();
  const scale = fontSize / font.unitsPerEm;

  let totalWidth = 0;
  for (let i = 0; i < text.length; i++) {
    const glyph = font.charToGlyph(text[i]);
    totalWidth += (glyph.advanceWidth || 0) * scale;
  }

  let startX: number;
  if (textAnchor === "middle") {
    startX = x - totalWidth / 2;
  } else if (textAnchor === "end") {
    startX = x - totalWidth;
  } else {
    startX = x;
  }

  const path = font.getPath(text, startX, y, fontSize);
  const pathData = path.toPathData(2);

  return `<path d="${pathData}" fill="${fill}"/>`;
}
