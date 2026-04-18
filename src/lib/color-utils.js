const HEX_COLOR_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function normalizeHexColor(value) {
  const trimmedValue = String(value ?? "").trim();
  if (trimmedValue.length === 0) {
    return null;
  }

  const match = trimmedValue.match(HEX_COLOR_PATTERN);
  if (!match) {
    return null;
  }

  const [, rawHex] = match;
  const expandedHex = rawHex.length === 3
    ? rawHex
        .toLowerCase()
        .split("")
        .map((channel) => `${channel}${channel}`)
        .join("")
    : rawHex.toLowerCase();

  return `#${expandedHex}`;
}

export function hexColorToNumber(value, fallback = "#000000") {
  const normalizedColor = normalizeHexColor(value) ?? normalizeHexColor(fallback) ?? "#000000";
  return Number.parseInt(normalizedColor.slice(1), 16);
}

export function format3mfColor(value, fallback = "#000000") {
  const normalizedColor = normalizeHexColor(value) ?? normalizeHexColor(fallback) ?? "#000000";
  return normalizedColor.toUpperCase();
}
