/**
 * Converts a color string (hex, rgb, hsl, cmyk, hsv) to CSS HSL triplet "H S% L%"
 * for use with hsl(var(--name)). Returns null if parsing fails.
 */

function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r = r / 255;
  g = g / 255;
  b = b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

function cmykToRgb(c: number, m: number, y: number, k: number): { r: number; g: number; b: number } {
  c = c / 100;
  m = m / 100;
  y = y / 100;
  k = k / 100;
  const r = 255 * (1 - c) * (1 - k);
  const g = 255 * (1 - m) * (1 - k);
  const b = 255 * (1 - y) * (1 - k);
  return { r, g, b };
}

function toCssHsl(h: number, s: number, l: number): string {
  const H = Math.round(clamp(h, 0, 360));
  const S = Math.round(clamp(s, 0, 100));
  const L = Math.round(clamp(l, 0, 100));
  return `${H} ${S}% ${L}%`;
}

/** Parse hex #RGB, #RRGGBB, #RRGGBBAA */
function parseHex(s: string): { r: number; g: number; b: number } | null {
  const t = s.trim().replace(/^#/, "");
  if (/^[0-9A-Fa-f]{3}$/.test(t)) {
    const r = parseInt(t[0] + t[0], 16);
    const g = parseInt(t[1] + t[1], 16);
    const b = parseInt(t[2] + t[2], 16);
    return { r, g, b };
  }
  if (/^[0-9A-Fa-f]{6}$/.test(t) || /^[0-9A-Fa-f]{8}$/.test(t)) {
    const r = parseInt(t.slice(0, 2), 16);
    const g = parseInt(t.slice(2, 4), 16);
    const b = parseInt(t.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

/** Parse rgb(r,g,b) or rgba(r,g,b,a) or "r, g, b" */
function parseRgb(s: string): { r: number; g: number; b: number } | null {
  const trimmed = s.trim();
  const fnMatch = trimmed.match(/^rgba?\s*\(\s*([^)]+)\s*\)$/);
  const inner = fnMatch ? fnMatch[1] : trimmed;
  const parts = inner.split(",").map((p) => p.trim().replace(/%/g, ""));
  if (parts.length < 3) return null;
  const r = parseFloat(parts[0]);
  const g = parseFloat(parts[1]);
  const b = parseFloat(parts[2]);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  const scale = r <= 1 && g <= 1 && b <= 1 ? 255 : 1;
  return { r: r * scale, g: g * scale, b: b * scale };
}

/** Parse hsl(H,S%,L%) or "H S% L%" or "H, S%, L%" */
function parseHsl(s: string): { h: number; s: number; l: number } | null {
  const trimmed = s.trim();
  const fnMatch = trimmed.match(/^hsla?\s*\(\s*([^)]+)\s*\)$/);
  const inner = fnMatch ? fnMatch[1] : trimmed;
  const parts = inner.split(/[\s,]+/).map((p) => p.trim().replace(/%/g, ""));
  if (parts.length < 3) return null;
  const h = parseFloat(parts[0]);
  const sl = parseFloat(parts[1]);
  const l = parseFloat(parts[2]);
  if (Number.isNaN(h) || Number.isNaN(sl) || Number.isNaN(l)) return null;
  return { h, s: sl, l };
}

/** Parse hsv(H,S%,V%) or "H S% V%" */
function parseHsv(input: string): { h: number; s: number; v: number } | null {
  const trimmed = input.trim();
  const fnMatch = trimmed.match(/^hsv\s*\(\s*([^)]+)\s*\)$/);
  const inner = fnMatch ? fnMatch[1] : trimmed;
  const parts = inner.split(/[\s,]+/).map((p) => p.trim().replace(/%/g, ""));
  if (parts.length < 3) return null;
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]);
  const v = parseFloat(parts[2]);
  if (Number.isNaN(h) || Number.isNaN(s) || Number.isNaN(v)) return null;
  return { h, s, v };
}

/** Parse cmyk(C%,M%,Y%,K%) or "C M Y K" with optional % */
function parseCmyk(s: string): { c: number; m: number; y: number; k: number } | null {
  const trimmed = s.trim();
  const fnMatch = trimmed.match(/^cmyk\s*\(\s*([^)]+)\s*\)$/i);
  const inner = fnMatch ? fnMatch[1] : trimmed;
  const parts = inner.split(/[\s,]+/).map((p) => p.trim().replace(/%/g, ""));
  if (parts.length < 4) return null;
  const c = parseFloat(parts[0]);
  const m = parseFloat(parts[1]);
  const y = parseFloat(parts[2]);
  const k = parseFloat(parts[3]);
  if (Number.isNaN(c) || Number.isNaN(m) || Number.isNaN(y) || Number.isNaN(k)) return null;
  const scale = c <= 1 && m <= 1 && y <= 1 && k <= 1 ? 100 : 1;
  return { c: c * scale, m: m * scale, y: y * scale, k: k * scale };
}

/**
 * Convert a color string to CSS HSL triplet "H S% L%" for use with hsl(var(--var)).
 * Supports: hex (#rgb, #rrggbb), rgb/rgba, hsl/hsla, hsv, cmyk.
 * Returns null if the string cannot be parsed.
 */
export function colorToCssHsl(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const str = input.trim();
  if (!str) return null;

  // Hex
  if (str.startsWith("#")) {
    const rgb = parseHex(str);
    if (rgb) {
      const { h, s: sat, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
      return toCssHsl(h, sat, l);
    }
    return null;
  }

  // HSL (already HSL – normalize to "H S% L%")
  if (str.toLowerCase().startsWith("hsl")) {
    const hsl = parseHsl(str);
    if (hsl) return toCssHsl(hsl.h, hsl.s, hsl.l);
    return null;
  }
  // Try numeric HSL: "220 90% 56%" or "220, 90%, 56%"
  if (/^\d+[\s,]+\d+\.?\d*%?[\s,]+\d+\.?\d*%?$/.test(str)) {
    const hsl = parseHsl(str);
    if (hsl) return toCssHsl(hsl.h, hsl.s, hsl.l);
  }

  // HSV
  if (str.toLowerCase().startsWith("hsv")) {
    const hsv = parseHsv(str);
    if (hsv) {
      const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      return toCssHsl(hsl.h, hsl.s, hsl.l);
    }
    return null;
  }

  // CMYK
  if (str.toLowerCase().startsWith("cmyk")) {
    const cmyk = parseCmyk(str);
    if (cmyk) {
      const rgb = cmykToRgb(cmyk.c, cmyk.m, cmyk.y, cmyk.k);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      return toCssHsl(hsl.h, hsl.s, hsl.l);
    }
    return null;
  }

  // RGB / RGBA / "r, g, b"
  const rgb = parseRgb(str);
  if (rgb) {
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return toCssHsl(hsl.h, hsl.s, hsl.l);
  }

  return null;
}
