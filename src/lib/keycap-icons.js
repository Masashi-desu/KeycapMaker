import * as lucideIcons from "@lucide/icons";
import fontAwesomeSolidIconSet from "../data/icon-sets/font-awesome-solid-icons.js";
import lucideOutlineBodySet from "../data/icon-sets/lucide-outline-bodies.js";
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
export const LUCIDE_ICON_VERSION = "1.21.0";
export const MATERIAL_SYMBOLS_ICON_SOURCE_URL = "https://fonts.google.com/icons";
export const MATERIAL_SYMBOLS_ICON_CATALOG_URL = "https://fonts.google.com/icons";
export const MATERIAL_SYMBOLS_ICON_FAVICON_URL = "https://www.gstatic.com/images/icons/material/apps/fonts/1x/catalog/v5/favicon.svg";
export const MATERIAL_SYMBOLS_ICON_LICENSE_LABEL = "Apache-2.0";
export const MATERIAL_SYMBOLS_ICON_VERSION = "1.2.79";
export const FONT_AWESOME_ICON_SOURCE_URL = "https://fontawesome.com/";
export const FONT_AWESOME_ICON_CATALOG_URL = "https://fontawesome.com/search?ic=free&s=solid";
export const FONT_AWESOME_ICON_FAVICON_URL = "https://fontawesome.com/favicon.ico";
export const FONT_AWESOME_ICON_LICENSE_LABEL = "CC BY 4.0 / MIT";
export const FONT_AWESOME_ICON_VERSION = "7.2.0";
export const REMIX_ICON_SOURCE_URL = "https://remixicon.com/";
export const REMIX_ICON_CATALOG_URL = "https://remixicon.com/";
export const REMIX_ICON_FAVICON_URL = "https://remixicon.com/favicon.ico";
export const REMIX_ICON_LICENSE_LABEL = "Remix Icon License v1.0";
export const REMIX_ICON_VERSION = "4.9.1";
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
const XML_ESCAPE_REPLACEMENTS = Object.freeze({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&apos;",
});
const legendIconSvgCache = new Map();
const normalizedIconBodyCache = new Map();

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

function normalizeSvgPathDataList(pathData) {
  return (Array.isArray(pathData) ? pathData : [pathData])
    .filter(Boolean)
    .map((value) => String(value));
}

function buildPathBody(pathData) {
  return normalizeSvgPathDataList(pathData)
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

  const previousProject = paper.project;
  paper.setup(new paper.Size(Number(width) || ICON_SQUARE_SIZE, Number(height) || ICON_SQUARE_SIZE));
  try {
    let item = paper.CompoundPath.create(sourcePathData);
    item = item.resolveCrossings().reorient(fillRule !== "evenodd", true);
    return item.pathData || sourcePathData;
  } finally {
    paper.project?.remove();
    if (previousProject) {
      previousProject.activate();
    }
  }
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

function collectLucideIconList(iconSet) {
  const iconByName = new Map();
  Object.values(lucideIcons).forEach((value) => {
    if (!isLucideIconData(value)) {
      return;
    }
    if (!iconByName.has(value.name)) {
      iconByName.set(value.name, {
        ...value,
        iconSet,
        aliases: [],
        body: lucideOutlineBodySet[value.name] ?? "",
        width: ICON_SQUARE_SIZE,
        height: ICON_SQUARE_SIZE,
      });
    }
  });

  return Array.from(iconByName.values());
}

function collectIconifyIconList(iconSet, iconData) {
  const icons = Object.entries(iconData.icons ?? {}).map(([name, definition]) => ({
    iconSet,
    name,
    aliases: definition.filledBody ? [`${name}-outline`, `${name}-fill`] : [],
    body: definition.body,
    filledBody: definition.filledBody,
    supportsFillStyle: Boolean(definition.filledBody),
    width: definition.width ?? iconData.width ?? ICON_SQUARE_SIZE,
    height: definition.height ?? iconData.height ?? ICON_SQUARE_SIZE,
  }));

  Object.entries(iconData.aliases ?? {}).forEach(([name, alias]) => {
    const parent = iconData.icons?.[alias.parent];
    if (!parent) {
      return;
    }
    icons.push({
      iconSet,
      name,
      aliases: [alias.parent],
      body: parent.body,
      filledBody: parent.filledBody,
      supportsFillStyle: Boolean(parent.filledBody),
      width: alias.width ?? parent.width ?? iconData.width ?? ICON_SQUARE_SIZE,
      height: alias.height ?? parent.height ?? iconData.height ?? ICON_SQUARE_SIZE,
    });
  });

  return icons;
}

function collectFontAwesomeIconList(iconSet) {
  return Object.entries(fontAwesomeSolidIconSet).map(([name, definition]) => ({
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
  }));
}

function collectRemixIconList(iconSet) {
  return Object.entries(remixIconPathSet)
    .filter(([name]) => !name.endsWith("-fill"))
    .map(([name, paths]) => {
      const baseName = name.endsWith("-line") ? name.slice(0, -"-line".length) : name;
      const filledVariantName = name.endsWith("-line") ? `${baseName}-fill` : "";
      const filledPaths = filledVariantName ? remixIconPathSet[filledVariantName] : null;
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
      };
    });
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

  const normalizedBody = normalizeSvgPathGeometry(body, width, height);
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

const ICON_PROVIDERS = Object.freeze([
  createIconProvider({
    key: LEGEND_ICON_SET_LUCIDE,
    label: "Lucide",
    packageName: "@lucide/icons",
    version: LUCIDE_ICON_VERSION,
    sourceUrl: LUCIDE_ICON_SOURCE_URL,
    catalogUrl: LUCIDE_ICON_CATALOG_URL,
    faviconUrl: LUCIDE_ICON_FAVICON_URL,
    licenseLabel: LUCIDE_ICON_LICENSE_LABEL,
    defaultIconName: DEFAULT_LEGEND_ICON_NAME,
    recommendedNames: KEYCAP_RECOMMENDED_LEGEND_ICON_NAMES,
    collectIcons: collectLucideIconList,
    buildSvg: buildFilledIconSvgContent,
    attributionLines: [
      "Lucide Icons: ISC License",
      "Source: https://lucide.dev/",
    ],
  }),
  createIconProvider({
    key: LEGEND_ICON_SET_MATERIAL_SYMBOLS,
    label: "Material Symbols",
    packageName: "@iconify-json/material-symbols",
    version: MATERIAL_SYMBOLS_ICON_VERSION,
    sourceUrl: MATERIAL_SYMBOLS_ICON_SOURCE_URL,
    catalogUrl: MATERIAL_SYMBOLS_ICON_CATALOG_URL,
    faviconUrl: MATERIAL_SYMBOLS_ICON_FAVICON_URL,
    licenseLabel: MATERIAL_SYMBOLS_ICON_LICENSE_LABEL,
    defaultIconName: "circle",
    recommendedNames: MATERIAL_SYMBOLS_RECOMMENDED_ICON_NAMES,
    collectIcons: (key) => collectIconifyIconList(key, materialSymbolsIconSet),
    buildSvg: buildFilledIconSvgContent,
    supportsFillStyle: true,
    getRuntimeName: (icon, options = {}) => (
      resolveLegendIconFill(options.filled) && icon.filledBody ? `${icon.name}-fill` : icon.name
    ),
    attributionLines: [
      "Material Symbols by Google: Apache License 2.0",
      "Source: https://fonts.google.com/icons",
      "Icon data package: @iconify-json/material-symbols",
    ],
  }),
  createIconProvider({
    key: LEGEND_ICON_SET_FONT_AWESOME,
    label: "Font Awesome Free Solid",
    packageName: "@fortawesome/free-solid-svg-icons",
    version: FONT_AWESOME_ICON_VERSION,
    sourceUrl: FONT_AWESOME_ICON_SOURCE_URL,
    catalogUrl: FONT_AWESOME_ICON_CATALOG_URL,
    faviconUrl: FONT_AWESOME_ICON_FAVICON_URL,
    licenseLabel: FONT_AWESOME_ICON_LICENSE_LABEL,
    defaultIconName: "circle",
    recommendedNames: FONT_AWESOME_RECOMMENDED_ICON_NAMES,
    collectIcons: collectFontAwesomeIconList,
    buildSvg: buildFilledIconSvgContent,
    attributionLines: [
      "Font Awesome Free Solid Icons: CC BY 4.0",
      "Code package: MIT License",
      "Source: https://fontawesome.com/",
      "Downloaded Font Awesome Free files include attribution comments; do not remove upstream notices from redistributed files.",
    ],
  }),
  createIconProvider({
    key: LEGEND_ICON_SET_REMIX_ICON,
    label: "Remix Icon",
    packageName: "remixicon",
    version: REMIX_ICON_VERSION,
    sourceUrl: REMIX_ICON_SOURCE_URL,
    catalogUrl: REMIX_ICON_CATALOG_URL,
    faviconUrl: REMIX_ICON_FAVICON_URL,
    licenseLabel: REMIX_ICON_LICENSE_LABEL,
    defaultIconName: "circle-line",
    recommendedNames: REMIX_ICON_RECOMMENDED_ICON_NAMES,
    collectIcons: collectRemixIconList,
    buildSvg: buildFilledIconSvgContent,
    supportsFillStyle: true,
    getRuntimeName: (icon, options = {}) => (
      resolveLegendIconFill(options.filled) && icon.filledVariantName ? icon.filledVariantName : icon.name
    ),
    attributionLines: [
      "Remix Icon: Remix Icon License v1.0",
      "Source: https://remixicon.com/",
      "Permitted for functional or decorative use in larger works; do not sell as a standalone icon pack or use icons as logos/trademarks.",
    ],
  }),
]);

const ICON_PROVIDER_BY_KEY = new Map(ICON_PROVIDERS.map((provider) => [provider.key, provider]));

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

export const LEGEND_ICON_SETS = Object.freeze(ICON_PROVIDERS.map((provider) => Object.freeze({
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

export const LUCIDE_ICON_OPTIONS = Object.freeze(getIconProvider(LEGEND_ICON_SET_LUCIDE).icons);

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

export function buildLucideIconSvg(icon, options = {}) {
  return buildLegendIconSvg(
    isLucideIconData(icon) ? { ...icon, iconSet: LEGEND_ICON_SET_LUCIDE, aliases: [] } : icon,
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
