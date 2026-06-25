import * as lucideIcons from "@lucide/icons";
import fontAwesomeSolidIconSet from "../data/icon-sets/font-awesome-solid-icons.js";
import materialSymbolsIconSet from "../data/icon-sets/material-symbols-base.js";
import remixIconPathSet from "../data/icon-sets/remix-icon-paths.js";
import paper from "paper";

export const LEGEND_CONTENT_TYPE_TEXT = "text";
export const LEGEND_CONTENT_TYPE_ICON = "icon";
export const DEFAULT_LEGEND_CONTENT_TYPE = LEGEND_CONTENT_TYPE_TEXT;
export const LEGEND_ICON_SET_LUCIDE = "lucide";
export const LEGEND_ICON_SET_MATERIAL_SYMBOLS = "material-symbols";
export const LEGEND_ICON_SET_FONT_AWESOME = "font-awesome";
export const LEGEND_ICON_SET_REMIX_ICON = "remix-icon";
export const DEFAULT_LEGEND_ICON_SET = LEGEND_ICON_SET_LUCIDE;
export const DEFAULT_LEGEND_ICON_NAME = "circle";
export const DEFAULT_LEGEND_ICON_FILL = false;
export const LUCIDE_ICON_SOURCE_URL = "https://lucide.dev/";
export const LUCIDE_ICON_CATALOG_URL = "https://lucide.dev/icons/";
export const LUCIDE_ICON_FAVICON_URL = "https://lucide.dev/favicon.ico";
export const LUCIDE_ICON_LICENSE_LABEL = "ISC";
export const LUCIDE_ICON_VERSION = "latest";
export const LUCIDE_ICON_FALLBACK_VERSION = "1.21.0";
export const LUCIDE_ICON_CDN_MODULE_URL = "https://cdn.jsdelivr.net/npm/@lucide/icons@latest/dist/esm/lucide-icons.mjs";
export const LUCIDE_ICON_CDN_PACKAGE_URL = "https://cdn.jsdelivr.net/npm/@lucide/icons@latest/package.json";
export const LUCIDE_ICON_CDN_PACKAGE_PAGE_URL = "https://www.jsdelivr.com/package/npm/@lucide/icons";
export const MATERIAL_SYMBOLS_ICON_SOURCE_URL = "https://fonts.google.com/icons";
export const MATERIAL_SYMBOLS_ICON_CATALOG_URL = "https://fonts.google.com/icons";
export const MATERIAL_SYMBOLS_ICON_FAVICON_URL = "https://www.gstatic.com/images/icons/material/apps/fonts/1x/catalog/v5/favicon.svg";
export const MATERIAL_SYMBOLS_ICON_LICENSE_LABEL = "Apache-2.0";
export const MATERIAL_SYMBOLS_ICON_VERSION = "latest";
export const MATERIAL_SYMBOLS_ICON_FALLBACK_VERSION = "1.2.79";
export const MATERIAL_SYMBOLS_ICON_CDN_MODULE_URL = "https://cdn.jsdelivr.net/npm/@iconify-json/material-symbols@latest/index.mjs";
export const MATERIAL_SYMBOLS_ICON_CDN_JSON_URL = "https://cdn.jsdelivr.net/npm/@iconify-json/material-symbols@latest/icons.json";
export const MATERIAL_SYMBOLS_ICON_CDN_PACKAGE_URL = "https://cdn.jsdelivr.net/npm/@iconify-json/material-symbols@latest/package.json";
export const MATERIAL_SYMBOLS_ICON_CDN_PACKAGE_PAGE_URL = "https://www.jsdelivr.com/package/npm/@iconify-json/material-symbols";
export const FONT_AWESOME_ICON_SOURCE_URL = "https://fontawesome.com/";
export const FONT_AWESOME_ICON_CATALOG_URL = "https://fontawesome.com/search?ic=free&s=solid";
export const FONT_AWESOME_ICON_FAVICON_URL = "https://fontawesome.com/favicon.ico";
export const FONT_AWESOME_ICON_LICENSE_LABEL = "CC BY 4.0 / MIT";
export const FONT_AWESOME_ICON_VERSION = "latest";
export const FONT_AWESOME_ICON_FALLBACK_VERSION = "7.2.0";
export const FONT_AWESOME_ICON_CDN_MODULE_URL = "https://cdn.jsdelivr.net/npm/@fortawesome/free-solid-svg-icons@latest/index.mjs";
export const FONT_AWESOME_ICON_CDN_PACKAGE_URL = "https://cdn.jsdelivr.net/npm/@fortawesome/free-solid-svg-icons@latest/package.json";
export const FONT_AWESOME_ICON_CDN_PACKAGE_PAGE_URL = "https://www.jsdelivr.com/package/npm/@fortawesome/free-solid-svg-icons";
export const REMIX_ICON_SOURCE_URL = "https://remixicon.com/";
export const REMIX_ICON_CATALOG_URL = "https://remixicon.com/";
export const REMIX_ICON_FAVICON_URL = "https://remixicon.com/favicon.ico";
export const REMIX_ICON_LICENSE_LABEL = "Remix Icon License v1.0";
export const REMIX_ICON_VERSION = "latest";
export const REMIX_ICON_FALLBACK_VERSION = "4.9.1";
export const REMIX_ICON_CDN_SYMBOL_URL = "https://cdn.jsdelivr.net/npm/remixicon@latest/fonts/remixicon.symbol.svg";
export const REMIX_ICON_CDN_PACKAGE_URL = "https://cdn.jsdelivr.net/npm/remixicon@latest/package.json";
export const REMIX_ICON_CDN_PACKAGE_PAGE_URL = "https://www.jsdelivr.com/package/npm/remixicon";
export const KEYCAP_RECOMMENDED_LEGEND_ICON_NAMES = Object.freeze([
  "arrow-up",
  "arrow-down",
  "arrow-left",
  "arrow-right",
  "arrow-up-down",
  "arrow-left-right",
  "corner-down-left",
  "corner-down-right",
  "corner-up-left",
  "corner-up-right",
  "delete",
  "space",
  "command",
  "option",
  "circle-power",
  "power",
  "power-off",
  "menu",
  "search",
  "settings",
  "settings-2",
  "lock",
  "lock-open",
  "volume",
  "volume-1",
  "volume-2",
  "volume-x",
  "volume-off",
  "mic",
  "mic-off",
  "play",
  "pause",
  "circle-play",
  "circle-pause",
  "square-play",
  "square-pause",
  "skip-back",
  "skip-forward",
  "rewind",
  "fast-forward",
  "wifi",
  "wifi-off",
  "bluetooth",
  "bluetooth-connected",
  "bluetooth-off",
  "sun",
  "sun-medium",
  "sun-dim",
  "moon",
  "monitor",
  "keyboard",
  "mouse",
  "gamepad-2",
  "terminal",
  "code",
  "save",
  "copy",
  "scissors",
  "clipboard",
  "undo",
  "redo",
  "mail",
  "bell",
  "camera",
  "music",
  "heart",
  "star",
  "circle",
  "square",
  "triangle",
  "x",
  "plus",
  "minus",
  "equal",
  "slash",
  "hash",
  "at-sign",
  "ampersand",
]);

const ICON_SQUARE_SIZE = 24;
const ICON_SVG_CACHE_LIMIT = 4096;
const NORMALIZED_ICON_BODY_CACHE_LIMIT = 4096;
const LUCIDE_DEFAULT_STROKE_WIDTH = 2;
const LUCIDE_STROKE_FLATTEN_TOLERANCE = 0.18;
const LUCIDE_STROKE_CAP_SEGMENTS = 8;
const LUCIDE_STROKE_DOT_SEGMENTS = 24;
const SVG_NUMBER_PATTERN = /[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;
const SVG_PATH_TOKEN_PATTERN = /[AaCcHhLlMmQqSsTtVvZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g;
const SVG_PATH_DATA_SAFE_PATTERN = /^[0-9AaCcEeHhLlMmQqSsTtVvZz+\-.,\s]+$/;
const LUCIDE_ALLOWED_TAGS = Object.freeze(new Set([
  "circle",
  "ellipse",
  "line",
  "path",
  "polygon",
  "polyline",
  "rect",
]));
const LUCIDE_NUMERIC_ATTRIBUTES = Object.freeze(new Set([
  "cx",
  "cy",
  "height",
  "r",
  "rx",
  "ry",
  "width",
  "x",
  "x1",
  "x2",
  "y",
  "y1",
  "y2",
  "stroke-width",
]));
const LUCIDE_ENUM_ATTRIBUTES = Object.freeze({
  "fill-rule": ["evenodd", "nonzero"],
  "clip-rule": ["evenodd", "nonzero"],
  "stroke-linecap": ["butt", "round", "square"],
  "stroke-linejoin": ["arcs", "bevel", "miter", "miter-clip", "round"],
});
const LUCIDE_PAINT_ATTRIBUTES = Object.freeze(new Set(["fill", "stroke"]));
const XML_ESCAPE_REPLACEMENTS = Object.freeze({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&apos;",
});
const legendIconSvgCache = new Map();
const normalizedIconBodyCache = new Map();
const lucideFilledIconBodyCache = new Map();
let iconCdnProviderLoadPromise = null;
let iconCdnLoadState = "idle";
let iconCdnLoadError = null;

const LOCAL_LUCIDE_ICON_SOURCE = Object.freeze({
  id: `local:${LUCIDE_ICON_FALLBACK_VERSION}`,
  icons: lucideIcons,
  isCdn: false,
  version: LUCIDE_ICON_FALLBACK_VERSION,
});
let currentLucideIconSource = LOCAL_LUCIDE_ICON_SOURCE;

const LOCAL_MATERIAL_SYMBOLS_ICON_SOURCE = Object.freeze({
  id: `local:${MATERIAL_SYMBOLS_ICON_FALLBACK_VERSION}`,
  iconData: materialSymbolsIconSet,
  isCdn: false,
  version: MATERIAL_SYMBOLS_ICON_FALLBACK_VERSION,
});
let currentMaterialSymbolsIconSource = LOCAL_MATERIAL_SYMBOLS_ICON_SOURCE;

const LOCAL_FONT_AWESOME_ICON_SOURCE = Object.freeze({
  id: `local:${FONT_AWESOME_ICON_FALLBACK_VERSION}`,
  iconSet: fontAwesomeSolidIconSet,
  isCdn: false,
  version: FONT_AWESOME_ICON_FALLBACK_VERSION,
});
let currentFontAwesomeIconSource = LOCAL_FONT_AWESOME_ICON_SOURCE;

const LOCAL_REMIX_ICON_SOURCE = Object.freeze({
  id: `local:${REMIX_ICON_FALLBACK_VERSION}`,
  pathSet: remixIconPathSet,
  isCdn: false,
  version: REMIX_ICON_FALLBACK_VERSION,
});
let currentRemixIconSource = LOCAL_REMIX_ICON_SOURCE;

const MATERIAL_SYMBOLS_RECOMMENDED_ICON_NAMES = Object.freeze([
  "arrow-upward",
  "arrow-downward",
  "arrow-back",
  "arrow-forward",
  "swap-vert",
  "swap-horiz",
  "keyboard-return",
  "keyboard-tab",
  "backspace",
  "space-bar",
  "keyboard-command-key",
  "keyboard-option-key",
  "power-settings-new",
  "power",
  "menu",
  "search",
  "settings",
  "lock",
  "lock-open",
  "volume-mute",
  "volume-down",
  "volume-up",
  "volume-off",
  "mic",
  "mic-off",
  "play-arrow",
  "pause",
  "skip-previous",
  "skip-next",
  "fast-rewind",
  "fast-forward",
  "wifi",
  "wifi-off",
  "bluetooth",
  "bluetooth-connected",
  "bluetooth-disabled",
  "light-mode",
  "dark-mode",
  "desktop-windows",
  "keyboard",
  "mouse",
  "sports-esports",
  "terminal",
  "code",
  "save",
  "content-copy",
  "content-cut",
  "content-paste",
  "undo",
  "redo",
  "mail",
  "notifications",
  "photo-camera",
  "music-note",
  "favorite",
  "star",
  "circle",
  "square",
  "change-history",
  "close",
  "add",
  "remove",
  "drag-handle",
  "tag",
  "alternate-email",
]);

const FONT_AWESOME_RECOMMENDED_ICON_NAMES = Object.freeze([
  "arrow-up",
  "arrow-down",
  "arrow-left",
  "arrow-right",
  "arrows-up-down",
  "arrows-left-right",
  "turn-down",
  "turn-up",
  "delete-left",
  "keyboard",
  "power-off",
  "bars",
  "magnifying-glass",
  "gear",
  "lock",
  "lock-open",
  "volume-low",
  "volume-high",
  "volume-xmark",
  "microphone",
  "microphone-slash",
  "play",
  "pause",
  "circle-play",
  "circle-pause",
  "backward-step",
  "forward-step",
  "backward-fast",
  "forward-fast",
  "wifi",
  "sun",
  "moon",
  "desktop",
  "computer-mouse",
  "gamepad",
  "terminal",
  "code",
  "floppy-disk",
  "copy",
  "scissors",
  "clipboard",
  "rotate-left",
  "rotate-right",
  "envelope",
  "bell",
  "camera",
  "music",
  "heart",
  "star",
  "circle",
  "square",
  "xmark",
  "plus",
  "minus",
  "equals",
  "slash",
  "hashtag",
  "at",
  "ampersand",
]);

const REMIX_ICON_RECOMMENDED_ICON_NAMES = Object.freeze([
  "arrow-up-line",
  "arrow-down-line",
  "arrow-left-line",
  "arrow-right-line",
  "arrow-up-down-line",
  "arrow-left-right-line",
  "corner-down-left-line",
  "corner-down-right-line",
  "corner-up-left-line",
  "corner-up-right-line",
  "delete-back-2-line",
  "space",
  "command-line",
  "option-line",
  "shut-down-line",
  "power-line",
  "menu-line",
  "search-line",
  "settings-3-line",
  "lock-line",
  "lock-unlock-line",
  "volume-down-line",
  "volume-up-line",
  "volume-mute-line",
  "mic-line",
  "mic-off-line",
  "play-line",
  "pause-line",
  "skip-back-line",
  "skip-forward-line",
  "rewind-line",
  "speed-up-line",
  "wifi-line",
  "wifi-off-line",
  "bluetooth-line",
  "sun-line",
  "moon-line",
  "computer-line",
  "keyboard-line",
  "mouse-line",
  "gamepad-line",
  "terminal-box-line",
  "code-line",
  "save-line",
  "file-copy-line",
  "scissors-line",
  "clipboard-line",
  "arrow-go-back-line",
  "arrow-go-forward-line",
  "mail-line",
  "notification-3-line",
  "camera-line",
  "music-2-line",
  "heart-line",
  "star-line",
  "circle-line",
  "square-line",
  "triangle-line",
  "close-line",
  "add-line",
  "subtract-line",
  "equal-line",
  "slash-commands",
  "hashtag",
  "at-line",
]);

function escapeXml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => XML_ESCAPE_REPLACEMENTS[char]);
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function uniqueStrings(values) {
  return Array.from(new Set(values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)));
}

function formatSvgNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "0";
  }

  const normalized = Math.abs(number) < 0.000001 ? 0 : number;
  return Number(normalized.toFixed(5)).toString();
}

function parseSvgNumber(value, fallback = 0) {
  const text = String(value ?? "").trim();
  if (!text) {
    return fallback;
  }
  const number = Number(text);
  return Number.isFinite(number) ? number : fallback;
}

function parseSvgPoints(value) {
  return [...String(value ?? "").matchAll(SVG_NUMBER_PATTERN)]
    .map((match) => Number(match[0]))
    .filter(Number.isFinite)
    .reduce((points, number, index, numbers) => {
      if (index % 2 === 0 && Number.isFinite(numbers[index + 1])) {
        points.push({ x: number, y: numbers[index + 1] });
      }
      return points;
    }, []);
}

function pointsToAttributeValue(points) {
  return points.map((point) => `${formatSvgNumber(point.x)},${formatSvgNumber(point.y)}`).join(" ");
}

function pointDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function dedupeAdjacentPoints(points) {
  const deduped = [];
  points.forEach((point) => {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      return;
    }
    const previous = deduped.at(-1);
    if (!previous || pointDistance(previous, point) > 0.00001) {
      deduped.push(point);
    }
  });
  return deduped;
}

function buildPolygonPath(points) {
  const deduped = dedupeAdjacentPoints(points);
  if (deduped.length < 3) {
    return "";
  }

  return `M${deduped.map((point) => `${formatSvgNumber(point.x)},${formatSvgNumber(point.y)}`).join("L")}Z`;
}

function buildEllipsePoints(cx, cy, rx, ry, segments = LUCIDE_STROKE_DOT_SEGMENTS) {
  const radiusX = Math.max(Number(rx) || 0, 0);
  const radiusY = Math.max(Number(ry) || 0, 0);
  if (!radiusX || !radiusY) {
    return [];
  }

  const pointCount = Math.max(12, Math.min(96, Math.ceil(segments)));
  return Array.from({ length: pointCount }, (_, index) => {
    const angle = (index / pointCount) * Math.PI * 2;
    return {
      x: cx + Math.cos(angle) * radiusX,
      y: cy + Math.sin(angle) * radiusY,
    };
  });
}

function buildEllipsePath(cx, cy, rx, ry, segments = LUCIDE_STROKE_DOT_SEGMENTS) {
  return buildPolygonPath(buildEllipsePoints(cx, cy, rx, ry, segments));
}

function buildRingPath(outerPoints, innerPoints) {
  const outerPath = buildPolygonPath(outerPoints);
  const innerPath = buildPolygonPath([...innerPoints].reverse());
  return `${outerPath}${innerPath}`;
}

function buildEllipseStrokeRingPath(cx, cy, rx, ry, strokeWidth) {
  const radius = Math.max(Number(strokeWidth) || 0, 0) / 2;
  if (!radius || !rx || !ry) {
    return "";
  }

  const pointCount = Math.max(32, Math.ceil(Math.max(rx, ry) * Math.PI * 4));
  const outerPoints = buildEllipsePoints(cx, cy, rx + radius, ry + radius, pointCount);
  const innerRx = Math.max(rx - radius, 0);
  const innerRy = Math.max(ry - radius, 0);
  if (!innerRx || !innerRy) {
    return buildPolygonPath(outerPoints);
  }
  return buildRingPath(outerPoints, buildEllipsePoints(cx, cy, innerRx, innerRy, pointCount));
}

function buildArcPoints(cx, cy, radius, startAngle, endAngle, {
  clockwise = false,
  segments = LUCIDE_STROKE_CAP_SEGMENTS,
} = {}) {
  let delta = endAngle - startAngle;
  if (clockwise) {
    while (delta > 0) {
      delta -= Math.PI * 2;
    }
  } else {
    while (delta < 0) {
      delta += Math.PI * 2;
    }
  }

  return Array.from({ length: Math.max(1, segments) }, (_, index) => {
    const angle = startAngle + (delta * (index + 1)) / Math.max(1, segments);
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });
}

function buildSegmentStrokePath(start, end, radius, linecap = "round") {
  const length = pointDistance(start, end);
  if (!length) {
    return buildEllipsePath(start.x, start.y, radius, radius);
  }

  const unitX = (end.x - start.x) / length;
  const unitY = (end.y - start.y) / length;
  const normalX = -unitY;
  const normalY = unitX;
  const cap = String(linecap ?? "round").toLowerCase();
  const capOffset = cap === "square" ? radius : 0;
  const a = {
    x: start.x - unitX * capOffset,
    y: start.y - unitY * capOffset,
  };
  const b = {
    x: end.x + unitX * capOffset,
    y: end.y + unitY * capOffset,
  };

  if (cap !== "round") {
    return buildPolygonPath([
      { x: a.x + normalX * radius, y: a.y + normalY * radius },
      { x: b.x + normalX * radius, y: b.y + normalY * radius },
      { x: b.x - normalX * radius, y: b.y - normalY * radius },
      { x: a.x - normalX * radius, y: a.y - normalY * radius },
    ]);
  }

  const theta = Math.atan2(unitY, unitX);
  const forwardLeftAngle = theta + Math.PI / 2;
  const forwardRightAngle = theta - Math.PI / 2;
  const points = [
    { x: start.x + normalX * radius, y: start.y + normalY * radius },
    { x: end.x + normalX * radius, y: end.y + normalY * radius },
    ...buildArcPoints(end.x, end.y, radius, forwardLeftAngle, forwardRightAngle, { clockwise: true }),
    { x: start.x - normalX * radius, y: start.y - normalY * radius },
    ...buildArcPoints(start.x, start.y, radius, forwardRightAngle, forwardLeftAngle, { clockwise: true }),
  ];

  return buildPolygonPath(points);
}

function buildPolylineStrokePaths(points, {
  closed = false,
  linecap = "round",
  linejoin = "round",
  strokeWidth = LUCIDE_DEFAULT_STROKE_WIDTH,
} = {}) {
  const radius = Math.max(Number(strokeWidth) || 0, 0) / 2;
  const cleanPoints = dedupeAdjacentPoints(points);
  if (!radius || cleanPoints.length < 2) {
    return [];
  }

  const paths = [];
  const segmentCount = closed ? cleanPoints.length : cleanPoints.length - 1;
  for (let index = 0; index < segmentCount; index += 1) {
    const start = cleanPoints[index];
    const end = cleanPoints[(index + 1) % cleanPoints.length];
    const pathData = buildSegmentStrokePath(start, end, radius, closed ? "butt" : linecap);
    if (pathData) {
      paths.push(pathData);
    }
  }

  if (String(linejoin ?? "round").toLowerCase() === "round" || closed) {
    const joinPoints = closed ? cleanPoints : cleanPoints.slice(1, -1);
    joinPoints.forEach((point) => {
      const pathData = buildEllipsePath(point.x, point.y, radius, radius);
      if (pathData) {
        paths.push(pathData);
      }
    });
  }

  return paths;
}

function withPaperProject(width, height, callback) {
  const previousProject = paper.project;
  paper.setup(new paper.Size(Number(width) || ICON_SQUARE_SIZE, Number(height) || ICON_SQUARE_SIZE));
  try {
    return callback();
  } finally {
    paper.project?.remove();
    if (previousProject) {
      previousProject.activate();
    }
  }
}

function collectPaperPaths(item) {
  if (!item) {
    return [];
  }
  if (Array.isArray(item.children) && item.children.length > 0) {
    return item.children.flatMap((child) => collectPaperPaths(child));
  }
  return Array.isArray(item.segments) ? [item] : [];
}

function splitSvgArcFlagToken(token, arcParameterIndex) {
  const value = String(token ?? "");
  if (arcParameterIndex === 3) {
    if (/^[01]{2,}$/.test(value)) {
      return value.split("");
    }
    const combinedWithCoordinate = value.match(/^([01])([01])((?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)$/i);
    if (combinedWithCoordinate) {
      return [combinedWithCoordinate[1], combinedWithCoordinate[2], combinedWithCoordinate[3]];
    }
  }
  if (arcParameterIndex === 4) {
    const combinedWithCoordinate = value.match(/^([01])((?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)$/i);
    if (combinedWithCoordinate) {
      return [combinedWithCoordinate[1], combinedWithCoordinate[2]];
    }
  }
  return [value];
}

function normalizeSvgPathDataForPaper(pathData) {
  const tokens = String(pathData ?? "").match(SVG_PATH_TOKEN_PATTERN) ?? [];
  const normalizedTokens = [];
  let command = "";
  let parameterIndex = 0;

  tokens.forEach((token) => {
    if (/^[AaCcHhLlMmQqSsTtVvZz]$/.test(token)) {
      command = token;
      parameterIndex = 0;
      normalizedTokens.push(token);
      return;
    }

    const arcParameterIndex = command.toLowerCase() === "a" ? parameterIndex % 7 : -1;
    const values = command.toLowerCase() === "a"
      ? splitSvgArcFlagToken(token, arcParameterIndex)
      : [token];
    values.forEach((value) => {
      normalizedTokens.push(value);
      parameterIndex += 1;
    });
  });

  return normalizedTokens.join(" ");
}

function flattenSvgPathData(pathData, width, height) {
  return withPaperProject(width, height, () => {
    let item = null;
    try {
      item = paper.CompoundPath.create(normalizeSvgPathDataForPaper(pathData));
      return collectPaperPaths(item).map((path) => {
        const flattened = path.clone();
        flattened.flatten(LUCIDE_STROKE_FLATTEN_TOLERANCE);
        const points = dedupeAdjacentPoints(flattened.segments.map((segment) => ({
          x: segment.point.x,
          y: segment.point.y,
        })));
        const closed = Boolean(path.closed || (points.length > 2 && pointDistance(points[0], points.at(-1)) <= 0.00001));
        flattened.remove();
        if (closed && points.length > 1 && pointDistance(points[0], points.at(-1)) <= 0.00001) {
          points.pop();
        }
        return { points, closed };
      });
    } finally {
      item?.remove();
    }
  });
}

function sanitizeSvgPathData(value) {
  const pathData = String(value ?? "").trim();
  return pathData && SVG_PATH_DATA_SAFE_PATTERN.test(pathData) ? pathData : "";
}

function sanitizePaintValue(value) {
  const paint = String(value ?? "").trim();
  if (!paint) {
    return "";
  }
  if (paint === "none" || paint === "currentColor") {
    return paint;
  }
  if (/^#[0-9a-f]{3,8}$/i.test(paint) || /^[a-z]+$/i.test(paint)) {
    return paint;
  }
  return "";
}

function escapeRegExp(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSvgAttribute(rawAttributes, attributeName) {
  const pattern = new RegExp(`(?:^|\\s)${escapeRegExp(attributeName)}\\s*=\\s*(["'])(.*?)\\1`, "i");
  return String(rawAttributes ?? "").match(pattern)?.[2] ?? "";
}

function sanitizeSvgRuleValue(value) {
  const rule = String(value ?? "").trim().toLowerCase();
  return rule === "evenodd" || rule === "nonzero" ? rule : "";
}

function sanitizeFilledSvgBody(body) {
  return [...String(body ?? "").matchAll(/<path\b([^>]*)\/?>/gi)].map((match) => {
    const rawAttributes = match[1];
    const pathData = sanitizeSvgPathData(extractSvgAttribute(rawAttributes, "d"));
    if (!pathData) {
      return "";
    }

    const fill = sanitizePaintValue(extractSvgAttribute(rawAttributes, "fill"));
    if (fill === "none") {
      return "";
    }

    const fillRule = sanitizeSvgRuleValue(extractSvgAttribute(rawAttributes, "fill-rule"));
    const clipRule = sanitizeSvgRuleValue(extractSvgAttribute(rawAttributes, "clip-rule"));
    const ruleAttributes = [
      fillRule ? `fill-rule="${fillRule}"` : "",
      clipRule ? `clip-rule="${clipRule}"` : "",
    ].filter(Boolean).join(" ");
    return `<path d="${escapeXml(pathData)}"${ruleAttributes ? ` ${ruleAttributes}` : ""}/>`;
  }).filter(Boolean).join("");
}

function extractSvgPathDataListFromBody(body) {
  return [...String(body ?? "").matchAll(/<path\b([^>]*)\/?>/gi)]
    .map((match) => sanitizeSvgPathData(extractSvgAttribute(match[1], "d")))
    .filter(Boolean);
}

function sanitizeLucideSvgNode(tag, attributes = {}) {
  const normalizedTag = String(tag ?? "").trim().toLowerCase();
  if (!LUCIDE_ALLOWED_TAGS.has(normalizedTag) || !attributes || typeof attributes !== "object") {
    return null;
  }

  const sanitizedAttributes = {};
  Object.entries(attributes).forEach(([rawName, rawValue]) => {
    const name = String(rawName ?? "").trim().toLowerCase();
    if (!name || name.startsWith("on") || name === "style" || name === "href" || name === "xlink:href") {
      return;
    }

    if (name === "d" && normalizedTag === "path") {
      const pathData = sanitizeSvgPathData(rawValue);
      if (pathData) {
        sanitizedAttributes.d = pathData;
      }
      return;
    }

    if (name === "points" && (normalizedTag === "polyline" || normalizedTag === "polygon")) {
      const points = parseSvgPoints(rawValue);
      if (points.length >= 2) {
        sanitizedAttributes.points = pointsToAttributeValue(points);
      }
      return;
    }

    if (LUCIDE_NUMERIC_ATTRIBUTES.has(name)) {
      const number = parseSvgNumber(rawValue, Number.NaN);
      if (Number.isFinite(number)) {
        sanitizedAttributes[name] = formatSvgNumber(number);
      }
      return;
    }

    if (LUCIDE_PAINT_ATTRIBUTES.has(name)) {
      const paint = sanitizePaintValue(rawValue);
      if (paint) {
        sanitizedAttributes[name] = paint;
      }
      return;
    }

    if (name in LUCIDE_ENUM_ATTRIBUTES) {
      const value = String(rawValue ?? "").trim().toLowerCase();
      if (LUCIDE_ENUM_ATTRIBUTES[name].includes(value)) {
        sanitizedAttributes[name] = value;
      }
    }
  });

  const hasRequiredGeometry = (
    (normalizedTag === "path" && sanitizedAttributes.d)
    || (normalizedTag === "line" && ["x1", "y1", "x2", "y2"].every((name) => name in sanitizedAttributes))
    || ((normalizedTag === "polyline" || normalizedTag === "polygon") && sanitizedAttributes.points)
    || (normalizedTag === "circle" && ["cx", "cy", "r"].every((name) => name in sanitizedAttributes))
    || (normalizedTag === "ellipse" && ["cx", "cy", "rx", "ry"].every((name) => name in sanitizedAttributes))
    || (normalizedTag === "rect" && ["x", "y", "width", "height"].every((name) => name in sanitizedAttributes))
  );
  if (!hasRequiredGeometry) {
    return null;
  }

  return Object.freeze([normalizedTag, Object.freeze(sanitizedAttributes)]);
}

export function sanitizeLucideSvgNodes(nodes) {
  if (!Array.isArray(nodes)) {
    return Object.freeze([]);
  }

  return Object.freeze(nodes
    .map((node) => (Array.isArray(node) ? sanitizeLucideSvgNode(node[0], node[1]) : null))
    .filter(Boolean));
}

function hasVisibleFill(attributes = {}) {
  return Boolean(attributes.fill && attributes.fill !== "none");
}

function getStrokeWidth(attributes = {}) {
  return parseSvgNumber(attributes["stroke-width"], LUCIDE_DEFAULT_STROKE_WIDTH);
}

function buildRoundedRectPoints(x, y, width, height, rx, ry) {
  const radiusX = Math.max(0, Math.min(rx, width / 2));
  const radiusY = Math.max(0, Math.min(ry, height / 2));
  if (!radiusX || !radiusY) {
    return [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ];
  }

  const points = [];
  const corners = [
    { cx: x + width - radiusX, cy: y + radiusY, from: -Math.PI / 2, to: 0 },
    { cx: x + width - radiusX, cy: y + height - radiusY, from: 0, to: Math.PI / 2 },
    { cx: x + radiusX, cy: y + height - radiusY, from: Math.PI / 2, to: Math.PI },
    { cx: x + radiusX, cy: y + radiusY, from: Math.PI, to: Math.PI * 1.5 },
  ];
  corners.forEach((corner) => {
    for (let index = 0; index <= LUCIDE_STROKE_CAP_SEGMENTS; index += 1) {
      const angle = corner.from + ((corner.to - corner.from) * index) / LUCIDE_STROKE_CAP_SEGMENTS;
      points.push({
        x: corner.cx + Math.cos(angle) * radiusX,
        y: corner.cy + Math.sin(angle) * radiusY,
      });
    }
  });
  return points;
}

function buildLucideFilledPathDataFromNode(node, width, height) {
  const [tag, attributes] = node;
  const strokeWidth = getStrokeWidth(attributes);
  const linecap = attributes["stroke-linecap"] ?? "round";
  const linejoin = attributes["stroke-linejoin"] ?? "round";
  const paths = [];

  if (tag === "path") {
    if (hasVisibleFill(attributes)) {
      paths.push(attributes.d);
    }
    flattenSvgPathData(attributes.d, width, height).forEach(({ points, closed }) => {
      paths.push(...buildPolylineStrokePaths(points, {
        closed,
        linecap,
        linejoin,
        strokeWidth,
      }));
    });
    return paths;
  }

  if (tag === "line") {
    return buildPolylineStrokePaths([
      { x: parseSvgNumber(attributes.x1), y: parseSvgNumber(attributes.y1) },
      { x: parseSvgNumber(attributes.x2), y: parseSvgNumber(attributes.y2) },
    ], { linecap, linejoin, strokeWidth });
  }

  if (tag === "polyline" || tag === "polygon") {
    return buildPolylineStrokePaths(parseSvgPoints(attributes.points), {
      closed: tag === "polygon",
      linecap,
      linejoin,
      strokeWidth,
    });
  }

  if (tag === "circle") {
    const cx = parseSvgNumber(attributes.cx);
    const cy = parseSvgNumber(attributes.cy);
    const radius = Math.max(parseSvgNumber(attributes.r), 0);
    if (hasVisibleFill(attributes)) {
      paths.push(buildEllipsePath(cx, cy, radius, radius, Math.ceil(radius * Math.PI * 4)));
    }
    paths.push(buildEllipseStrokeRingPath(cx, cy, radius, radius, strokeWidth));
    return paths;
  }

  if (tag === "ellipse") {
    const cx = parseSvgNumber(attributes.cx);
    const cy = parseSvgNumber(attributes.cy);
    const rx = Math.max(parseSvgNumber(attributes.rx), 0);
    const ry = Math.max(parseSvgNumber(attributes.ry), 0);
    if (hasVisibleFill(attributes)) {
      paths.push(buildEllipsePath(cx, cy, rx, ry, Math.ceil(Math.max(rx, ry) * Math.PI * 4)));
    }
    paths.push(buildEllipseStrokeRingPath(cx, cy, rx, ry, strokeWidth));
    return paths;
  }

  if (tag === "rect") {
    const x = parseSvgNumber(attributes.x);
    const y = parseSvgNumber(attributes.y);
    const rectWidth = Math.max(parseSvgNumber(attributes.width), 0);
    const rectHeight = Math.max(parseSvgNumber(attributes.height), 0);
    const rx = Math.max(parseSvgNumber(attributes.rx, attributes.ry ? parseSvgNumber(attributes.ry) : 0), 0);
    const ry = Math.max(parseSvgNumber(attributes.ry, rx), 0);
    const points = buildRoundedRectPoints(x, y, rectWidth, rectHeight, rx, ry);
    if (hasVisibleFill(attributes)) {
      paths.push(buildPolygonPath(points));
    }
    paths.push(...buildPolylineStrokePaths(points, {
      closed: true,
      linecap,
      linejoin,
      strokeWidth,
    }));
    return paths;
  }

  return [];
}

function buildLucideFilledIconBody(icon) {
  const sanitizedNodes = sanitizeLucideSvgNodes(icon?.node);
  if (sanitizedNodes.length === 0) {
    return "";
  }

  const cacheKey = [
    icon?.sourceId ?? "custom",
    icon?.name ?? "",
    icon?.size ?? "",
    JSON.stringify(sanitizedNodes),
  ].join("\u0000");
  const cachedBody = lucideFilledIconBodyCache.get(cacheKey);
  if (cachedBody) {
    return cachedBody;
  }

  const width = icon?.width ?? icon?.size ?? ICON_SQUARE_SIZE;
  const height = icon?.height ?? icon?.size ?? ICON_SQUARE_SIZE;
  const body = sanitizedNodes
    .flatMap((node) => buildLucideFilledPathDataFromNode(node, width, height))
    .filter(Boolean)
    .map((pathData) => `<path d="${escapeXml(pathData)}"/>`)
    .join("");

  if (lucideFilledIconBodyCache.size >= NORMALIZED_ICON_BODY_CACHE_LIMIT) {
    lucideFilledIconBodyCache.clear();
  }
  lucideFilledIconBodyCache.set(cacheKey, body);
  return body;
}

function normalizeSvgPathDataList(pathData) {
  return (Array.isArray(pathData) ? pathData : [pathData])
    .filter(Boolean)
    .map((value) => String(value));
}

function buildPathBody(pathData) {
  return normalizeSvgPathDataList(pathData)
    .map(sanitizeSvgPathData)
    .filter(Boolean)
    .map((value) => `<path d="${escapeXml(value)}"/>`)
    .join("");
}

function normalizeSvgFillRule(value) {
  return String(value ?? "").trim().toLowerCase() === "evenodd" ? "evenodd" : "nonzero";
}

function normalizeSvgPathDataForModel(pathData, width, height, fillRule = "nonzero") {
  const sourcePathData = String(pathData ?? "").trim();
  if (!sourcePathData) {
    return sourcePathData;
  }

  return withPaperProject(width, height, () => {
    let item = null;
    try {
      item = paper.CompoundPath.create(sourcePathData);
      item = item.resolveCrossings().reorient(fillRule !== "evenodd", true);
      return item.pathData || sourcePathData;
    } catch {
      return sourcePathData;
    } finally {
      item?.remove();
    }
  });
}

function normalizeSvgPathGeometry(body, width, height) {
  const sourceBody = String(body ?? "");
  if (!sourceBody.includes("<path")) {
    return sourceBody;
  }

  const cacheKey = `${width}\u0000${height}\u0000${sourceBody}`;
  if (normalizedIconBodyCache.has(cacheKey)) {
    return normalizedIconBodyCache.get(cacheKey);
  }

  const normalizedBody = sourceBody.replace(/<path\b([^>]*)>/g, (match, rawAttributes) => {
    const pathDataMatch = rawAttributes.match(/\sd=(["'])(.*?)\1/);
    if (!pathDataMatch) {
      return match;
    }

    const fillRuleMatch = rawAttributes.match(/\sfill-rule=(["'])(.*?)\1/);
    const normalizedPathData = normalizeSvgPathDataForModel(
      pathDataMatch[2],
      width,
      height,
      normalizeSvgFillRule(fillRuleMatch?.[2]),
    );
    const attributes = rawAttributes.replace(
      pathDataMatch[0],
      ` d="${escapeXml(normalizedPathData)}"`,
    );
    return `<path${attributes}>`;
  });

  if (normalizedIconBodyCache.size >= NORMALIZED_ICON_BODY_CACHE_LIMIT) {
    normalizedIconBodyCache.clear();
  }
  normalizedIconBodyCache.set(cacheKey, normalizedBody);
  return normalizedBody;
}

function applyDefaultSvgPathRules(body) {
  return String(body ?? "").replace(/<path\b([^>]*)>/g, (match, rawAttributes) => {
    const hasFillRule = /\sfill-rule\s*=/.test(match);
    const hasClipRule = /\sclip-rule\s*=/.test(match);
    if (hasFillRule && hasClipRule) {
      return match;
    }

    const selfClosing = /\/\s*$/.test(rawAttributes);
    const attributes = selfClosing ? rawAttributes.replace(/\/\s*$/, "") : rawAttributes;
    const defaultAttributes = [
      hasFillRule ? "" : `fill-rule="nonzero"`,
      hasClipRule ? "" : `clip-rule="nonzero"`,
    ].filter(Boolean).join(" ");

    return `<path${attributes}${attributes.trim() ? " " : ""}${defaultAttributes}${selfClosing ? "/" : ""}>`;
  });
}

export function resolveLegendIconFill(value = DEFAULT_LEGEND_ICON_FILL) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function isLucideIconData(value) {
  return value
    && typeof value === "object"
    && typeof value.name === "string"
    && Array.isArray(value.node);
}

function getLucideIconExports(iconSource = currentLucideIconSource) {
  const source = iconSource?.icons?.icons && typeof iconSource.icons.icons === "object"
    ? iconSource.icons.icons
    : iconSource?.icons;
  return source && typeof source === "object" ? Object.values(source) : [];
}

function isMaterialSymbolsStyleVariantName(name) {
  const normalizedName = String(name ?? "");
  return normalizedName.endsWith("-outline")
    || normalizedName.endsWith("-rounded")
    || normalizedName.endsWith("-sharp")
    || normalizedName.endsWith("-outline-rounded")
    || normalizedName.endsWith("-outline-sharp");
}

function createMaterialSymbolsIconDataFromIconifyData(iconData) {
  const sourceIcons = iconData?.icons && typeof iconData.icons === "object" ? iconData.icons : {};
  const icons = {};

  Object.entries(sourceIcons).forEach(([name, definition]) => {
    if (isMaterialSymbolsStyleVariantName(name)) {
      return;
    }

    const outlineDefinition = sourceIcons[`${name}-outline`];
    const bodyDefinition = outlineDefinition ?? definition;
    const body = sanitizeFilledSvgBody(bodyDefinition?.body);
    const filledBody = outlineDefinition ? sanitizeFilledSvgBody(definition?.body) : "";
    if (!body) {
      return;
    }

    icons[name] = {
      body,
      ...(filledBody ? { filledBody } : {}),
      width: bodyDefinition?.width ?? definition?.width ?? iconData.width ?? ICON_SQUARE_SIZE,
      height: bodyDefinition?.height ?? definition?.height ?? iconData.height ?? ICON_SQUARE_SIZE,
    };
  });

  const aliases = {};
  Object.entries(iconData?.aliases ?? {}).forEach(([name, alias]) => {
    const parent = String(alias?.parent ?? "");
    if (isMaterialSymbolsStyleVariantName(name) || !icons[parent]) {
      return;
    }
    aliases[name] = {
      parent,
      ...(alias.width ? { width: alias.width } : {}),
      ...(alias.height ? { height: alias.height } : {}),
    };
  });

  return Object.freeze({
    ...iconData,
    icons: Object.freeze(icons),
    aliases: Object.freeze(aliases),
    width: iconData?.width ?? ICON_SQUARE_SIZE,
    height: iconData?.height ?? ICON_SQUARE_SIZE,
  });
}

function isFontAwesomeSolidIconDefinition(value) {
  return value
    && typeof value === "object"
    && value.prefix === "fas"
    && typeof value.iconName === "string"
    && Array.isArray(value.icon)
    && value.icon.length >= 5;
}

function createFontAwesomeIconSetFromModule(iconModule) {
  const icons = {};
  const candidates = [
    ...Object.values(iconModule?.fas && typeof iconModule.fas === "object" ? iconModule.fas : {}),
    ...Object.values(iconModule && typeof iconModule === "object" ? iconModule : {}),
  ];

  candidates.forEach((value) => {
    if (!isFontAwesomeSolidIconDefinition(value) || icons[value.iconName]) {
      return;
    }

    const [width, height, aliases, unicode, svgPathData] = value.icon;
    const body = buildPathBody(svgPathData);
    if (!body) {
      return;
    }
    icons[value.iconName] = {
      width,
      height,
      aliases: Array.isArray(aliases) ? aliases.filter((alias) => typeof alias === "string") : [],
      unicode,
      svgPathData,
    };
  });

  return Object.freeze(icons);
}

function createRemixIconPathSetFromSymbolSvg(symbolSvg) {
  const pathSet = {};
  [...String(symbolSvg ?? "").matchAll(/<symbol\b([^>]*)>([\s\S]*?)<\/symbol>/gi)].forEach((match) => {
    const id = extractSvgAttribute(match[1], "id");
    if (!id.startsWith("ri-")) {
      return;
    }

    const body = sanitizeFilledSvgBody(match[2]);
    const paths = extractSvgPathDataListFromBody(body);
    if (paths.length > 0) {
      pathSet[id.slice("ri-".length)] = paths;
    }
  });

  return Object.freeze(pathSet);
}

function collectLucideIconList(iconSet, iconSource = currentLucideIconSource) {
  const iconByName = new Map();
  getLucideIconExports(iconSource).forEach((value) => {
    if (!isLucideIconData(value)) {
      return;
    }
    const node = sanitizeLucideSvgNodes(value.node);
    if (node.length === 0) {
      return;
    }
    if (!iconByName.has(value.name)) {
      iconByName.set(value.name, {
        ...value,
        iconSet,
        aliases: uniqueStrings(value.aliases ?? []),
        node,
        sourceId: iconSource.id,
        source: iconSource.isCdn ? "cdn" : "local",
        body: "",
        width: value.size ?? ICON_SQUARE_SIZE,
        height: value.size ?? ICON_SQUARE_SIZE,
      });
    }
  });

  return Array.from(iconByName.values());
}

function collectIconifyIconList(iconSet, iconSource = currentMaterialSymbolsIconSource) {
  const iconData = iconSource.iconData ?? {};
  const icons = Object.entries(iconData.icons ?? {}).map(([name, definition]) => ({
    iconSet,
    name,
    aliases: definition.filledBody ? [`${name}-outline`, `${name}-fill`] : [],
    body: sanitizeFilledSvgBody(definition.body),
    filledBody: sanitizeFilledSvgBody(definition.filledBody),
    supportsFillStyle: Boolean(definition.filledBody),
    width: definition.width ?? iconData.width ?? ICON_SQUARE_SIZE,
    height: definition.height ?? iconData.height ?? ICON_SQUARE_SIZE,
    sourceId: iconSource.id,
    source: iconSource.isCdn ? "cdn" : "local",
  })).filter((icon) => icon.body);

  Object.entries(iconData.aliases ?? {}).forEach(([name, alias]) => {
    const parent = iconData.icons?.[alias.parent];
    if (!parent) {
      return;
    }
    icons.push({
      iconSet,
      name,
      aliases: [alias.parent],
      body: sanitizeFilledSvgBody(parent.body),
      filledBody: sanitizeFilledSvgBody(parent.filledBody),
      supportsFillStyle: Boolean(parent.filledBody),
      width: alias.width ?? parent.width ?? iconData.width ?? ICON_SQUARE_SIZE,
      height: alias.height ?? parent.height ?? iconData.height ?? ICON_SQUARE_SIZE,
      sourceId: iconSource.id,
      source: iconSource.isCdn ? "cdn" : "local",
    });
  });

  return icons;
}

function collectFontAwesomeIconList(iconSet, iconSource = currentFontAwesomeIconSource) {
  return Object.entries(iconSource.iconSet ?? {}).map(([name, definition]) => ({
    iconSet,
    name,
    aliases: uniqueStrings([
      name.replace(/-/g, " "),
      ...(Array.isArray(definition.aliases) ? definition.aliases : []),
    ]),
    width: definition.width,
    height: definition.height,
    unicode: definition.unicode,
    body: buildPathBody(definition.svgPathData),
    sourceId: iconSource.id,
    source: iconSource.isCdn ? "cdn" : "local",
  })).filter((icon) => icon.body);
}

function collectRemixIconList(iconSet, iconSource = currentRemixIconSource) {
  const pathSet = iconSource.pathSet ?? {};
  return Object.entries(pathSet)
    .filter(([name]) => !name.endsWith("-fill"))
    .map(([name, paths]) => {
      const baseName = name.endsWith("-line") ? name.slice(0, -"-line".length) : name;
      const filledVariantName = name.endsWith("-line") ? `${baseName}-fill` : "";
      const filledPaths = filledVariantName ? pathSet[filledVariantName] : null;
      return {
        iconSet,
        name,
        aliases: uniqueStrings([baseName, filledVariantName]),
        body: buildPathBody(paths),
        filledBody: filledPaths ? buildPathBody(filledPaths) : undefined,
        filledVariantName,
        supportsFillStyle: Boolean(filledPaths),
        width: ICON_SQUARE_SIZE,
        height: ICON_SQUARE_SIZE,
        sourceId: iconSource.id,
        source: iconSource.isCdn ? "cdn" : "local",
      };
    }).filter((icon) => icon.body);
}

function buildSvgDocument({
  body,
  width = ICON_SQUARE_SIZE,
  height = ICON_SQUARE_SIZE,
  fill = "none",
  stroke = "none",
  strokeWidth,
  strokeLinecap,
  strokeLinejoin,
  normalizeGeometry = true,
}) {
  const rootAttributes = [
    `xmlns="http://www.w3.org/2000/svg"`,
    `width="${ICON_SQUARE_SIZE}mm"`,
    `height="${ICON_SQUARE_SIZE}mm"`,
    `viewBox="0 0 ${escapeXml(width)} ${escapeXml(height)}"`,
    `fill="${escapeXml(fill)}"`,
    `stroke="${escapeXml(stroke)}"`,
    `fill-rule="nonzero"`,
    `clip-rule="nonzero"`,
    strokeWidth ? `stroke-width="${escapeXml(strokeWidth)}"` : "",
    strokeLinecap ? `stroke-linecap="${escapeXml(strokeLinecap)}"` : "",
    strokeLinejoin ? `stroke-linejoin="${escapeXml(strokeLinejoin)}"` : "",
  ].filter(Boolean).join(" ");

  const normalizedBody = normalizeGeometry ? normalizeSvgPathGeometry(body, width, height) : String(body ?? "");
  return `<svg ${rootAttributes}>${applyDefaultSvgPathRules(normalizedBody)}</svg>`;
}

function buildFilledIconSvgContent(icon, options = {}) {
  const useFilledBody = resolveLegendIconFill(options.filled) && icon.filledBody;
  return buildSvgDocument({
    body: useFilledBody ? icon.filledBody : (icon.body ?? ""),
    width: icon.width ?? ICON_SQUARE_SIZE,
    height: icon.height ?? ICON_SQUARE_SIZE,
    fill: options.color ?? "#000000",
    stroke: "none",
  });
}

function buildLucideFilledIconSvgContent(icon, options = {}) {
  return buildSvgDocument({
    body: buildLucideFilledIconBody(icon),
    width: icon.width ?? icon.size ?? ICON_SQUARE_SIZE,
    height: icon.height ?? icon.size ?? ICON_SQUARE_SIZE,
    fill: options.color ?? "#000000",
    stroke: "none",
    normalizeGeometry: false,
  });
}

function isIconFillAvailable(icon) {
  const body = String(icon?.body ?? "");
  const filledBody = String(icon?.filledBody ?? "");
  return Boolean(icon?.supportsFillStyle && filledBody && filledBody !== body);
}

function createIconProvider({
  key,
  label,
  packageName,
  version,
  sourceUrl,
  catalogUrl,
  faviconUrl = "",
  licenseLabel,
  defaultIconName,
  recommendedNames,
  collectIcons,
  buildSvg,
  supportsFillStyle = false,
  getRuntimeName = (icon) => icon.name,
  attributionLines = [],
}) {
  const icons = Object.freeze(collectIcons(key)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((icon) => Object.freeze({
      ...icon,
      iconSet: key,
      aliases: Object.freeze(uniqueStrings(icon.aliases ?? [])),
    })));
  const iconByName = new Map();
  const normalizedNameToName = new Map();
  icons.forEach((icon) => {
    iconByName.set(icon.name, icon);
    normalizedNameToName.set(normalizeSearchText(icon.name), icon.name);
    icon.aliases.forEach((alias) => {
      if (!normalizedNameToName.has(normalizeSearchText(alias))) {
        normalizedNameToName.set(normalizeSearchText(alias), icon.name);
      }
    });
  });

  const resolvedDefaultIconName = iconByName.has(defaultIconName)
    ? defaultIconName
    : icons[0]?.name ?? DEFAULT_LEGEND_ICON_NAME;

  return Object.freeze({
    key,
    label,
    packageName,
    version,
    sourceUrl,
    catalogUrl,
    faviconUrl,
    licenseLabel,
    defaultIconName: resolvedDefaultIconName,
    recommendedNames: Object.freeze(recommendedNames),
    attributionLines: Object.freeze(attributionLines),
    supportsFillStyle,
    icons,
    iconByName,
    normalizedNameToName,
    buildSvg,
    getRuntimeName,
  });
}

function formatIconSourceVersion(iconSource, latestVersion, fallbackVersion) {
  return iconSource.isCdn
    ? `${iconSource.version || latestVersion} (CDN latest)`
    : `${iconSource.version || fallbackVersion} (fallback)`;
}

function createLucideIconProvider() {
  return createIconProvider({
    key: LEGEND_ICON_SET_LUCIDE,
    label: "Lucide",
    packageName: "@lucide/icons",
    version: formatIconSourceVersion(currentLucideIconSource, LUCIDE_ICON_VERSION, LUCIDE_ICON_FALLBACK_VERSION),
    sourceUrl: LUCIDE_ICON_SOURCE_URL,
    catalogUrl: currentLucideIconSource.isCdn ? LUCIDE_ICON_CDN_PACKAGE_PAGE_URL : LUCIDE_ICON_CATALOG_URL,
    faviconUrl: LUCIDE_ICON_FAVICON_URL,
    licenseLabel: LUCIDE_ICON_LICENSE_LABEL,
    defaultIconName: DEFAULT_LEGEND_ICON_NAME,
    recommendedNames: KEYCAP_RECOMMENDED_LEGEND_ICON_NAMES,
    collectIcons: (key) => collectLucideIconList(key, currentLucideIconSource),
    buildSvg: buildLucideFilledIconSvgContent,
    attributionLines: [
      "Lucide Icons: ISC License",
      "Source: https://lucide.dev/",
      `Icon data package CDN: ${LUCIDE_ICON_CDN_MODULE_URL}`,
    ],
  });
}

function createMaterialSymbolsIconProvider() {
  return createIconProvider({
    key: LEGEND_ICON_SET_MATERIAL_SYMBOLS,
    label: "Material Symbols",
    packageName: "@iconify-json/material-symbols",
    version: formatIconSourceVersion(
      currentMaterialSymbolsIconSource,
      MATERIAL_SYMBOLS_ICON_VERSION,
      MATERIAL_SYMBOLS_ICON_FALLBACK_VERSION,
    ),
    sourceUrl: MATERIAL_SYMBOLS_ICON_SOURCE_URL,
    catalogUrl: currentMaterialSymbolsIconSource.isCdn ? MATERIAL_SYMBOLS_ICON_CDN_PACKAGE_PAGE_URL : MATERIAL_SYMBOLS_ICON_CATALOG_URL,
    faviconUrl: MATERIAL_SYMBOLS_ICON_FAVICON_URL,
    licenseLabel: MATERIAL_SYMBOLS_ICON_LICENSE_LABEL,
    defaultIconName: "circle",
    recommendedNames: MATERIAL_SYMBOLS_RECOMMENDED_ICON_NAMES,
    collectIcons: (key) => collectIconifyIconList(key, currentMaterialSymbolsIconSource),
    buildSvg: buildFilledIconSvgContent,
    supportsFillStyle: true,
    getRuntimeName: (icon, options = {}) => (
      resolveLegendIconFill(options.filled) && icon.filledBody ? `${icon.name}-fill` : icon.name
    ),
    attributionLines: [
      "Material Symbols by Google: Apache License 2.0",
      "Source: https://fonts.google.com/icons",
      `Icon data package CDN: ${MATERIAL_SYMBOLS_ICON_CDN_JSON_URL}`,
    ],
  });
}

function createFontAwesomeIconProvider() {
  return createIconProvider({
    key: LEGEND_ICON_SET_FONT_AWESOME,
    label: "Font Awesome Free Solid",
    packageName: "@fortawesome/free-solid-svg-icons",
    version: formatIconSourceVersion(
      currentFontAwesomeIconSource,
      FONT_AWESOME_ICON_VERSION,
      FONT_AWESOME_ICON_FALLBACK_VERSION,
    ),
    sourceUrl: FONT_AWESOME_ICON_SOURCE_URL,
    catalogUrl: currentFontAwesomeIconSource.isCdn ? FONT_AWESOME_ICON_CDN_PACKAGE_PAGE_URL : FONT_AWESOME_ICON_CATALOG_URL,
    faviconUrl: FONT_AWESOME_ICON_FAVICON_URL,
    licenseLabel: FONT_AWESOME_ICON_LICENSE_LABEL,
    defaultIconName: "circle",
    recommendedNames: FONT_AWESOME_RECOMMENDED_ICON_NAMES,
    collectIcons: (key) => collectFontAwesomeIconList(key, currentFontAwesomeIconSource),
    buildSvg: buildFilledIconSvgContent,
    attributionLines: [
      "Font Awesome Free Solid Icons: CC BY 4.0",
      "Code package: MIT License",
      "Source: https://fontawesome.com/",
      `Icon data package CDN: ${FONT_AWESOME_ICON_CDN_MODULE_URL}`,
      "Downloaded Font Awesome Free files include attribution comments; do not remove upstream notices from redistributed files.",
    ],
  });
}

function createRemixIconProvider() {
  return createIconProvider({
    key: LEGEND_ICON_SET_REMIX_ICON,
    label: "Remix Icon",
    packageName: "remixicon",
    version: formatIconSourceVersion(currentRemixIconSource, REMIX_ICON_VERSION, REMIX_ICON_FALLBACK_VERSION),
    sourceUrl: REMIX_ICON_SOURCE_URL,
    catalogUrl: currentRemixIconSource.isCdn ? REMIX_ICON_CDN_PACKAGE_PAGE_URL : REMIX_ICON_CATALOG_URL,
    faviconUrl: REMIX_ICON_FAVICON_URL,
    licenseLabel: REMIX_ICON_LICENSE_LABEL,
    defaultIconName: "circle-line",
    recommendedNames: REMIX_ICON_RECOMMENDED_ICON_NAMES,
    collectIcons: (key) => collectRemixIconList(key, currentRemixIconSource),
    buildSvg: buildFilledIconSvgContent,
    supportsFillStyle: true,
    getRuntimeName: (icon, options = {}) => (
      resolveLegendIconFill(options.filled) && icon.filledVariantName ? icon.filledVariantName : icon.name
    ),
    attributionLines: [
      "Remix Icon: Remix Icon License v1.0",
      "Source: https://remixicon.com/",
      `Icon data package CDN: ${REMIX_ICON_CDN_SYMBOL_URL}`,
      "Permitted for functional or decorative use in larger works; do not sell as a standalone icon pack or use icons as logos/trademarks.",
    ],
  });
}

function createStaticIconProviders() {
  return [
    createLucideIconProvider(),
    createMaterialSymbolsIconProvider(),
    createFontAwesomeIconProvider(),
    createRemixIconProvider(),
  ];
}

let ICON_PROVIDERS = Object.freeze([]);
let ICON_PROVIDER_BY_KEY = new Map();

export let LEGEND_ICON_SETS = Object.freeze([]);
export let LUCIDE_ICON_OPTIONS = Object.freeze([]);

function createLegendIconSetMeta(providers) {
  return Object.freeze(providers.map((provider) => Object.freeze({
    key: provider.key,
    value: provider.key,
    label: provider.label,
    packageName: provider.packageName,
    version: provider.version,
    sourceUrl: provider.sourceUrl,
    catalogUrl: provider.catalogUrl,
    faviconUrl: provider.faviconUrl,
    licenseLabel: provider.licenseLabel,
    defaultIconName: provider.defaultIconName,
    iconCount: provider.icons.length,
    supportsFillStyle: provider.supportsFillStyle,
    attributionLines: provider.attributionLines,
  })));
}

function rebuildIconProviderRegistry() {
  ICON_PROVIDERS = Object.freeze(createStaticIconProviders());
  ICON_PROVIDER_BY_KEY = new Map(ICON_PROVIDERS.map((provider) => [provider.key, provider]));
  LEGEND_ICON_SETS = createLegendIconSetMeta(ICON_PROVIDERS);
  LUCIDE_ICON_OPTIONS = Object.freeze(getIconProvider(LEGEND_ICON_SET_LUCIDE).icons);
  legendIconSvgCache.clear();
  normalizedIconBodyCache.clear();
  lucideFilledIconBodyCache.clear();
}

function isNodeRuntime() {
  return typeof process !== "undefined" && Boolean(process.versions?.node);
}

function canUseBrowserCdnImports() {
  return typeof window !== "undefined"
    && typeof document !== "undefined"
    && !isNodeRuntime();
}

async function fetchWithTimeout(url, timeoutMs = 4000) {
  if (typeof globalThis.fetch !== "function") {
    throw new Error("fetch is not available.");
  }

  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;
  try {
    const response = await globalThis.fetch(url, {
      cache: "force-cache",
      signal: controller?.signal,
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    return response;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function fetchJsonWithTimeout(url, timeoutMs = 4000) {
  return (await fetchWithTimeout(url, timeoutMs)).json();
}

async function fetchTextWithTimeout(url, timeoutMs = 4000) {
  return (await fetchWithTimeout(url, timeoutMs)).text();
}

async function importLucideCdnModule(url = LUCIDE_ICON_CDN_MODULE_URL) {
  return import(/* @vite-ignore */ url);
}

async function importMaterialSymbolsCdnModule(url = MATERIAL_SYMBOLS_ICON_CDN_MODULE_URL) {
  return import(/* @vite-ignore */ url);
}

async function importFontAwesomeCdnModule(url = FONT_AWESOME_ICON_CDN_MODULE_URL) {
  return import(/* @vite-ignore */ url);
}

function buildLucideIconSourceFromModule(iconModule, metadata = {}) {
  const icons = iconModule?.icons && typeof iconModule.icons === "object" ? iconModule : null;
  if (!icons || getLucideIconExports({ icons }).filter(isLucideIconData).length === 0) {
    throw new Error("Lucide CDN module did not expose icon data.");
  }

  const version = String(metadata.version ?? "").trim() || LUCIDE_ICON_VERSION;
  return Object.freeze({
    id: `cdn:${version}:${LUCIDE_ICON_CDN_MODULE_URL}`,
    icons,
    isCdn: true,
    version,
  });
}

async function loadLucideIconSourceFromCdn() {
  if (!canUseBrowserCdnImports()) {
    return null;
  }

  const metadataPromise = typeof globalThis.fetch === "function"
    ? fetchJsonWithTimeout(LUCIDE_ICON_CDN_PACKAGE_URL).catch(() => ({}))
    : Promise.resolve({});
  const [metadata, iconModule] = await Promise.all([
    metadataPromise,
    importLucideCdnModule(),
  ]);
  return buildLucideIconSourceFromModule(iconModule, metadata);
}

function buildMaterialSymbolsIconSourceFromIconifyData(iconData, metadata = {}) {
  const normalizedIconData = createMaterialSymbolsIconDataFromIconifyData(iconData);
  if (Object.keys(normalizedIconData.icons ?? {}).length === 0) {
    throw new Error("Material Symbols CDN data did not expose icon data.");
  }

  const version = String(metadata.version ?? metadata.info?.version ?? "").trim() || MATERIAL_SYMBOLS_ICON_VERSION;
  return Object.freeze({
    id: `cdn:${version}:${MATERIAL_SYMBOLS_ICON_CDN_JSON_URL}`,
    iconData: normalizedIconData,
    isCdn: true,
    version,
  });
}

async function loadMaterialSymbolsIconSourceFromCdn() {
  if (!canUseBrowserCdnImports()) {
    return null;
  }

  const metadataPromise = typeof globalThis.fetch === "function"
    ? fetchJsonWithTimeout(MATERIAL_SYMBOLS_ICON_CDN_PACKAGE_URL).catch(() => ({}))
    : Promise.resolve({});

  try {
    const [metadata, iconModule] = await Promise.all([
      metadataPromise,
      importMaterialSymbolsCdnModule(),
    ]);
    const iconData = iconModule?.icons;
    if (!iconData?.icons) {
      throw new Error("Material Symbols CDN module did not expose icon data.");
    }
    return buildMaterialSymbolsIconSourceFromIconifyData(iconData, {
      ...metadata,
      version: metadata.version ?? iconModule.info?.version,
    });
  } catch (moduleError) {
    if (typeof globalThis.fetch !== "function") {
      throw moduleError;
    }
    const [metadata, iconData] = await Promise.all([
      metadataPromise,
      fetchJsonWithTimeout(MATERIAL_SYMBOLS_ICON_CDN_JSON_URL),
    ]);
    return buildMaterialSymbolsIconSourceFromIconifyData(iconData, metadata);
  }
}

function buildFontAwesomeIconSourceFromModule(iconModule, metadata = {}) {
  const iconSet = createFontAwesomeIconSetFromModule(iconModule);
  if (Object.keys(iconSet).length === 0) {
    throw new Error("Font Awesome CDN module did not expose icon data.");
  }

  const version = String(metadata.version ?? "").trim() || FONT_AWESOME_ICON_VERSION;
  return Object.freeze({
    id: `cdn:${version}:${FONT_AWESOME_ICON_CDN_MODULE_URL}`,
    iconSet,
    isCdn: true,
    version,
  });
}

async function loadFontAwesomeIconSourceFromCdn() {
  if (!canUseBrowserCdnImports()) {
    return null;
  }

  const metadataPromise = typeof globalThis.fetch === "function"
    ? fetchJsonWithTimeout(FONT_AWESOME_ICON_CDN_PACKAGE_URL).catch(() => ({}))
    : Promise.resolve({});
  const [metadata, iconModule] = await Promise.all([
    metadataPromise,
    importFontAwesomeCdnModule(),
  ]);
  return buildFontAwesomeIconSourceFromModule(iconModule, metadata);
}

function buildRemixIconSourceFromSymbolSvg(symbolSvg, metadata = {}) {
  const pathSet = createRemixIconPathSetFromSymbolSvg(symbolSvg);
  if (Object.keys(pathSet).length === 0) {
    throw new Error("Remix Icon CDN symbol file did not expose icon data.");
  }

  const version = String(metadata.version ?? "").trim() || REMIX_ICON_VERSION;
  return Object.freeze({
    id: `cdn:${version}:${REMIX_ICON_CDN_SYMBOL_URL}`,
    pathSet,
    isCdn: true,
    version,
  });
}

async function loadRemixIconSourceFromCdn() {
  if (!canUseBrowserCdnImports()) {
    return null;
  }

  const metadataPromise = typeof globalThis.fetch === "function"
    ? fetchJsonWithTimeout(REMIX_ICON_CDN_PACKAGE_URL).catch(() => ({}))
    : Promise.resolve({});
  const [metadata, symbolSvg] = await Promise.all([
    metadataPromise,
    fetchTextWithTimeout(REMIX_ICON_CDN_SYMBOL_URL),
  ]);
  return buildRemixIconSourceFromSymbolSvg(symbolSvg, metadata);
}

function applyIconSourceUpdates(updates = {}) {
  let changed = false;
  if (updates.lucide && updates.lucide.id !== currentLucideIconSource.id) {
    currentLucideIconSource = updates.lucide;
    changed = true;
  }
  if (updates.materialSymbols && updates.materialSymbols.id !== currentMaterialSymbolsIconSource.id) {
    currentMaterialSymbolsIconSource = updates.materialSymbols;
    changed = true;
  }
  if (updates.fontAwesome && updates.fontAwesome.id !== currentFontAwesomeIconSource.id) {
    currentFontAwesomeIconSource = updates.fontAwesome;
    changed = true;
  }
  if (updates.remixIcon && updates.remixIcon.id !== currentRemixIconSource.id) {
    currentRemixIconSource = updates.remixIcon;
    changed = true;
  }
  if (changed) {
    rebuildIconProviderRegistry();
  }
  return changed;
}

function isAnyIconCdnActive() {
  return currentLucideIconSource.isCdn
    || currentMaterialSymbolsIconSource.isCdn
    || currentFontAwesomeIconSource.isCdn
    || currentRemixIconSource.isCdn;
}

function getTotalIconCount() {
  return LEGEND_ICON_SETS.reduce((total, iconSet) => total + (iconSet.iconCount ?? 0), 0);
}

function createIconSourceState(iconSource) {
  return Object.freeze({
    isCdnActive: Boolean(iconSource.isCdn),
    version: iconSource.version,
  });
}

function getIconCdnProviderStates() {
  return Object.freeze({
    [LEGEND_ICON_SET_LUCIDE]: createIconSourceState(currentLucideIconSource),
    [LEGEND_ICON_SET_MATERIAL_SYMBOLS]: createIconSourceState(currentMaterialSymbolsIconSource),
    [LEGEND_ICON_SET_FONT_AWESOME]: createIconSourceState(currentFontAwesomeIconSource),
    [LEGEND_ICON_SET_REMIX_ICON]: createIconSourceState(currentRemixIconSource),
  });
}

export function getLucideIconCdnLoadState() {
  return Object.freeze({
    state: iconCdnLoadState,
    error: iconCdnLoadError,
    isCdnActive: currentLucideIconSource.isCdn,
    version: currentLucideIconSource.version,
    providers: getIconCdnProviderStates(),
  });
}

export async function initializeLegendIconProvidersFromCdn() {
  if (!canUseBrowserCdnImports()) {
    return Object.freeze({
      status: "skipped",
      isCdnActive: isAnyIconCdnActive(),
      iconCount: getTotalIconCount(),
      providers: getIconCdnProviderStates(),
    });
  }

  if (!iconCdnProviderLoadPromise) {
    iconCdnLoadState = "loading";
    iconCdnLoadError = null;
    const loaders = [
      ["lucide", loadLucideIconSourceFromCdn],
      ["materialSymbols", loadMaterialSymbolsIconSourceFromCdn],
      ["fontAwesome", loadFontAwesomeIconSourceFromCdn],
      ["remixIcon", loadRemixIconSourceFromCdn],
    ];
    iconCdnProviderLoadPromise = Promise.allSettled(loaders.map(async ([key, load]) => [key, await load()]))
      .then((results) => {
        const updates = {};
        const errors = [];
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            const [key, iconSource] = result.value;
            if (iconSource) {
              updates[key] = iconSource;
            }
            return;
          }
          errors.push(String(result.reason ?? "Unknown icon CDN load error."));
        });

        applyIconSourceUpdates(updates);
        iconCdnLoadState = Object.keys(updates).length > 0 ? "loaded" : "failed";
        iconCdnLoadError = errors.length > 0 ? errors.join("\n") : null;
        return Object.freeze({ updates: Object.freeze(updates), errors: Object.freeze(errors) });
      })
      .catch((error) => {
        iconCdnLoadState = "failed";
        iconCdnLoadError = `${error}`;
        return Object.freeze({ updates: Object.freeze({}), errors: Object.freeze([`${error}`]) });
      });
  }

  const result = await iconCdnProviderLoadPromise;
  return Object.freeze({
    status: isAnyIconCdnActive() ? "loaded" : iconCdnLoadState,
    isCdnActive: isAnyIconCdnActive(),
    iconCount: getTotalIconCount(),
    version: currentLucideIconSource.version,
    providers: getIconCdnProviderStates(),
    error: iconCdnLoadError,
    loadedProviders: Object.keys(result?.updates ?? {}).length,
  });
}
function getIconProvider(iconSet = DEFAULT_LEGEND_ICON_SET) {
  return ICON_PROVIDER_BY_KEY.get(iconSet) ?? ICON_PROVIDER_BY_KEY.get(DEFAULT_LEGEND_ICON_SET);
}

function getIconSearchScore(icon, normalizedQuery) {
  const tokens = uniqueStrings([icon.name, ...(icon.aliases ?? [])]).map(normalizeSearchText);
  let score = Number.POSITIVE_INFINITY;
  tokens.forEach((token) => {
    if (token === normalizedQuery) {
      score = Math.min(score, 0);
    } else if (token.startsWith(normalizedQuery)) {
      score = Math.min(score, 1);
    } else if (token.includes(normalizedQuery)) {
      score = Math.min(score, 2);
    }
  });

  return Number.isFinite(score) ? score : null;
}

rebuildIconProviderRegistry();

export function listLegendIconSets() {
  return LEGEND_ICON_SETS;
}

export function getLegendIconSetMeta(iconSet = DEFAULT_LEGEND_ICON_SET) {
  const provider = getIconProvider(resolveLegendIconSet(iconSet));
  return LEGEND_ICON_SETS.find((entry) => entry.key === provider.key) ?? LEGEND_ICON_SETS[0];
}

export function resolveLegendIconSet(value = DEFAULT_LEGEND_ICON_SET) {
  return ICON_PROVIDER_BY_KEY.has(value) ? value : DEFAULT_LEGEND_ICON_SET;
}

export function resolveLegendContentType(value = DEFAULT_LEGEND_CONTENT_TYPE) {
  return value === LEGEND_CONTENT_TYPE_ICON
    ? LEGEND_CONTENT_TYPE_ICON
    : DEFAULT_LEGEND_CONTENT_TYPE;
}

export function resolveLegendIconName(name = DEFAULT_LEGEND_ICON_NAME, iconSet = DEFAULT_LEGEND_ICON_SET) {
  const provider = getIconProvider(resolveLegendIconSet(iconSet));
  const normalizedName = normalizeSearchText(name);
  return provider.normalizedNameToName.get(normalizedName) ?? provider.defaultIconName;
}

export function isLegendIconFillSupported(iconSet = DEFAULT_LEGEND_ICON_SET) {
  return Boolean(getIconProvider(resolveLegendIconSet(iconSet)).supportsFillStyle);
}

export function isLegendIconFillAvailable(name = DEFAULT_LEGEND_ICON_NAME, iconSet = DEFAULT_LEGEND_ICON_SET) {
  const provider = getIconProvider(resolveLegendIconSet(iconSet));
  if (!provider.supportsFillStyle) {
    return false;
  }

  return isIconFillAvailable(resolveLegendIcon(name, provider.key));
}

export function inferLegendIconFillFromName(name = DEFAULT_LEGEND_ICON_NAME, iconSet = DEFAULT_LEGEND_ICON_SET) {
  const provider = getIconProvider(resolveLegendIconSet(iconSet));
  if (!provider.supportsFillStyle) {
    return false;
  }

  const normalizedName = normalizeSearchText(name);
  const resolvedName = provider.normalizedNameToName.get(normalizedName);
  const icon = provider.iconByName.get(resolvedName);
  if (!icon) {
    return false;
  }
  if (!isIconFillAvailable(icon)) {
    return false;
  }

  return normalizeSearchText(`${icon.name}-fill`) === normalizedName
    || normalizeSearchText(icon.filledVariantName) === normalizedName;
}

export function resolveLegendIcon(name = DEFAULT_LEGEND_ICON_NAME, iconSet = DEFAULT_LEGEND_ICON_SET) {
  const provider = getIconProvider(resolveLegendIconSet(iconSet));
  const resolvedName = resolveLegendIconName(name, provider.key);
  return provider.iconByName.get(resolvedName) ?? provider.iconByName.get(provider.defaultIconName) ?? provider.icons[0];
}

export function listAvailableLegendIcons(iconSet = DEFAULT_LEGEND_ICON_SET) {
  return getIconProvider(resolveLegendIconSet(iconSet)).icons;
}

export function listRecommendedLegendIcons(iconSet = DEFAULT_LEGEND_ICON_SET) {
  const provider = getIconProvider(resolveLegendIconSet(iconSet));
  return provider.recommendedNames
    .map((name) => provider.iconByName.get(resolveLegendIconName(name, provider.key)))
    .filter(Boolean);
}

export function searchLegendIcons(query = "", iconSet = DEFAULT_LEGEND_ICON_SET, limit = 80) {
  const provider = getIconProvider(resolveLegendIconSet(iconSet));
  const normalizedQuery = normalizeSearchText(query);
  const maxResults = Math.max(Number(limit) || 0, 0);
  if (!normalizedQuery) {
    return listRecommendedLegendIcons(provider.key).slice(0, maxResults);
  }

  const scored = provider.icons
    .map((icon) => {
      const score = getIconSearchScore(icon, normalizedQuery);
      return score == null ? null : { icon, score };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || a.icon.name.localeCompare(b.icon.name));

  return scored.slice(0, maxResults).map((entry) => entry.icon);
}

export function buildLegendIconSvg(icon, options = {}) {
  const iconSet = resolveLegendIconSet(icon?.iconSet ?? options.iconSet ?? DEFAULT_LEGEND_ICON_SET);
  const provider = getIconProvider(iconSet);
  const resolvedIcon = icon?.name && icon.iconSet === provider.key
    ? icon
    : resolveLegendIcon(icon?.name ?? icon ?? provider.defaultIconName, provider.key);
  const filled = provider.supportsFillStyle
    && isIconFillAvailable(resolvedIcon)
    && resolveLegendIconFill(options.filled);

  const cacheKey = [
    provider.key,
    resolvedIcon.name,
    resolvedIcon.sourceId ?? "",
    filled ? "filled" : "outlined",
    options.color ?? "#000000",
    options.strokeWidth ?? "",
  ].join("\u0000");
  const cachedSvg = legendIconSvgCache.get(cacheKey);
  if (cachedSvg) {
    return cachedSvg;
  }

  const svg = provider.buildSvg(resolvedIcon, { ...options, filled });
  if (legendIconSvgCache.size >= ICON_SVG_CACHE_LIMIT) {
    legendIconSvgCache.clear();
  }
  legendIconSvgCache.set(cacheKey, svg);
  return svg;
}

export async function buildLegendIconSvgAsync(icon, options = {}) {
  const iconSet = resolveLegendIconSet(icon?.iconSet ?? options.iconSet ?? DEFAULT_LEGEND_ICON_SET);
  await initializeLegendIconProvidersFromCdn();

  const provider = getIconProvider(iconSet);
  const iconName = icon?.name ?? icon ?? provider.defaultIconName;
  return buildLegendIconSvg(resolveLegendIcon(iconName, provider.key), options);
}

export function buildLucideIconSvg(icon, options = {}) {
  return buildLegendIconSvg(
    isLucideIconData(icon) ? {
      ...icon,
      iconSet: LEGEND_ICON_SET_LUCIDE,
      aliases: uniqueStrings(icon.aliases ?? []),
      node: sanitizeLucideSvgNodes(icon.node),
      width: icon.width ?? icon.size ?? ICON_SQUARE_SIZE,
      height: icon.height ?? icon.size ?? ICON_SQUARE_SIZE,
    } : icon,
    { ...options, iconSet: LEGEND_ICON_SET_LUCIDE },
  );
}

export function getLegendIconRuntimePath(name = DEFAULT_LEGEND_ICON_NAME, iconSet = DEFAULT_LEGEND_ICON_SET, options = {}) {
  const resolvedSet = resolveLegendIconSet(iconSet);
  const resolvedName = resolveLegendIconName(name, resolvedSet);
  const provider = getIconProvider(resolvedSet);
  const icon = provider.iconByName.get(resolvedName) ?? provider.iconByName.get(provider.defaultIconName) ?? provider.icons[0];
  const runtimeName = provider.getRuntimeName(icon, {
    filled: provider.supportsFillStyle
      && isIconFillAvailable(icon)
      && resolveLegendIconFill(options.filled),
  });
  return `/icons/${resolvedSet}/${runtimeName}.svg`;
}
