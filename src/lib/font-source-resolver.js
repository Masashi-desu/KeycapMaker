const SUPPORTED_FONT_FORMATS = new Set(["ttf", "otf"]);
const UNSUPPORTED_WEB_FONT_FORMATS = new Set(["woff", "woff2"]);
const GOOGLE_FONTS_REPO_LICENSE_DIRS = Object.freeze(["ofl", "apache", "ufl"]);
const GOOGLE_FONTS_API_BASE_URL = "https://api.github.com/repos/google/fonts/contents";

const STATIC_WEIGHT_NAMES = Object.freeze({
  100: "thin",
  200: "extralight",
  300: "light",
  400: "regular",
  500: "medium",
  600: "semibold",
  700: "bold",
  800: "extrabold",
  900: "black",
});

function trimTrailingUrlPunctuation(value) {
  return String(value ?? "").replace(/[),.;]+$/u, "");
}

function uniqueValues(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function tryCreateUrl(value, baseUrl = undefined) {
  try {
    const url = new URL(String(value ?? "").trim(), baseUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function extractCandidateUrls(input) {
  const source = String(input ?? "");
  const urls = [];
  const patterns = [
    /\b(?:href|src)\s*=\s*(["'])(.*?)\1/giu,
    /@import\s+(?:url\(\s*)?(["']?)(https?:\/\/[^'")\s]+)\1\s*\)?/giu,
    /\burl\(\s*(["']?)(https?:\/\/[^'")]+)\1\s*\)/giu,
    /\bhttps?:\/\/[^\s"'<>]+/giu,
  ];

  patterns.forEach((pattern) => {
    let match = pattern.exec(source);
    while (match) {
      const candidate = trimTrailingUrlPunctuation(match[2] ?? match[0]);
      if (tryCreateUrl(candidate)) {
        urls.push(candidate);
      }
      match = pattern.exec(source);
    }
  });

  return uniqueValues(urls);
}

function getPathExtension(url) {
  const pathName = tryCreateUrl(url)?.pathname ?? String(url ?? "");
  const match = /\.([a-z0-9]+)$/iu.exec(pathName);
  return match ? match[1].toLowerCase() : "";
}

function normalizeFontFormat(format, url = "") {
  const normalizedFormat = String(format ?? "").trim().toLowerCase().replaceAll("\"", "").replaceAll("'", "");
  if (["ttf", "truetype"].includes(normalizedFormat)) {
    return "ttf";
  }
  if (["otf", "opentype"].includes(normalizedFormat)) {
    return "otf";
  }
  if (["woff", "woff2"].includes(normalizedFormat)) {
    return normalizedFormat;
  }

  const extension = getPathExtension(url);
  return extension || "";
}

function isSupportedFontUrl(url) {
  return SUPPORTED_FONT_FORMATS.has(getPathExtension(url));
}

function detectFontBinaryFormat(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 4) {
    return "";
  }

  const signature = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (signature === "OTTO") {
    return "otf";
  }
  if (signature === "wOFF") {
    return "woff";
  }
  if (signature === "wOF2") {
    return "woff2";
  }
  if (bytes[0] === 0x00 && bytes[1] === 0x01 && bytes[2] === 0x00 && bytes[3] === 0x00) {
    return "ttf";
  }
  if (signature === "true") {
    return "ttf";
  }

  return "";
}

function filenameFromUrl(url, fallback = "RemoteFont.ttf") {
  const parsedUrl = tryCreateUrl(url);
  const pathName = parsedUrl?.pathname ?? "";
  const pathNameParts = pathName.split("/").filter(Boolean);
  const fileName = decodeURIComponent(pathNameParts.at(-1) ?? "").trim();
  return fileName || fallback;
}

function ensureSupportedFontBytes(bytes, sourceUrl, expectedFormat = "") {
  const detectedFormat = detectFontBinaryFormat(bytes);
  if (!SUPPORTED_FONT_FORMATS.has(detectedFormat)) {
    const formatLabel = detectedFormat || "unknown";
    throw new Error(`Unsupported font source format: ${formatLabel}. Use a TTF / OTF file URL or a supported provider URL.`);
  }
  if (expectedFormat && expectedFormat !== detectedFormat) {
    throw new Error(`Font source format mismatch: expected ${expectedFormat}, got ${detectedFormat}.`);
  }

  if (bytes.byteLength === 0) {
    throw new Error(`Remote font file is empty: ${sourceUrl}`);
  }

  return detectedFormat;
}

async function fetchBytes(url, expectedFormat = "") {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Font source request failed: ${url}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const format = ensureSupportedFontBytes(bytes, url, expectedFormat);
  return { bytes, format };
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Font CSS request failed: ${url}`);
  }

  return response.text();
}

function parseCssDeclarations(block) {
  const declarations = new Map();
  const declarationPattern = /([\w-]+)\s*:\s*([^;]+);/giu;
  let match = declarationPattern.exec(block);
  while (match) {
    declarations.set(match[1].trim().toLowerCase(), match[2].trim());
    match = declarationPattern.exec(block);
  }
  return declarations;
}

function parseFontFaceBlocks(cssText) {
  const blocks = [];
  const blockPattern = /@font-face\s*\{([^{}]*)\}/giu;
  let match = blockPattern.exec(cssText);
  while (match) {
    blocks.push(parseCssDeclarations(match[1]));
    match = blockPattern.exec(cssText);
  }
  return blocks;
}

function stripCssString(value) {
  return String(value ?? "").trim().replace(/^["']|["']$/gu, "");
}

function parseCssFontSources(srcValue, baseUrl = undefined) {
  const sources = [];
  const sourcePattern = /url\(\s*(?:"([^"]+)"|'([^']+)'|([^)]*?))\s*\)\s*(?:format\(\s*(?:"([^"]+)"|'([^']+)'|([^)]*?))\s*\))?/giu;
  let match = sourcePattern.exec(String(srcValue ?? ""));
  while (match) {
    const rawUrl = stripCssString(match[1] ?? match[2] ?? match[3] ?? "");
    const url = tryCreateUrl(rawUrl, baseUrl);
    const rawFormat = match[4] ?? match[5] ?? match[6] ?? "";
    if (url) {
      sources.push({
        url: url.toString(),
        format: normalizeFontFormat(rawFormat, url.toString()),
      });
    }
    match = sourcePattern.exec(String(srcValue ?? ""));
  }
  return sources;
}

async function resolveDirectFontUrl(url) {
  const format = normalizeFontFormat("", url);
  if (!SUPPORTED_FONT_FORMATS.has(format)) {
    return null;
  }

  const result = await fetchBytes(url, format);
  return {
    bytes: result.bytes,
    format: result.format,
    fileName: filenameFromUrl(url, `RemoteFont.${result.format}`),
    provider: tryCreateUrl(url)?.host ?? "Remote Font",
    sourceKind: "remote",
    sourceUrl: url,
    sourceLabel: url,
  };
}

async function resolveGenericCssFontSource(cssText, cssUrl = "") {
  const baseUrl = cssUrl || undefined;
  const fontFaces = parseFontFaceBlocks(cssText);
  const supportedCandidates = [];
  const unsupportedFormats = new Set();

  fontFaces.forEach((declarations) => {
    const familyName = stripCssString(declarations.get("font-family"));
    const fontStyle = stripCssString(declarations.get("font-style"));
    const fontWeight = stripCssString(declarations.get("font-weight"));
    const sources = parseCssFontSources(declarations.get("src"), baseUrl);

    sources.forEach((source) => {
      if (SUPPORTED_FONT_FORMATS.has(source.format)) {
        supportedCandidates.push({
          ...source,
          familyName,
          fontStyle,
          fontWeight,
        });
        return;
      }
      if (UNSUPPORTED_WEB_FONT_FORMATS.has(source.format)) {
        unsupportedFormats.add(source.format);
      }
    });
  });

  const candidate = supportedCandidates[0];
  if (!candidate) {
    if (unsupportedFormats.size > 0) {
      throw new Error(`Only ${Array.from(unsupportedFormats).join(" / ")} sources were found. TTF / OTF sources are required for OpenSCAD export.`);
    }
    throw new Error("No TTF / OTF font source was found in the CSS.");
  }

  const result = await fetchBytes(candidate.url, candidate.format);
  return {
    bytes: result.bytes,
    format: result.format,
    fileName: filenameFromUrl(candidate.url, `${candidate.familyName || "RemoteFont"}.${result.format}`),
    familyName: candidate.familyName,
    fontStyle: candidate.fontStyle,
    fontWeight: candidate.fontWeight,
    provider: cssUrl ? (tryCreateUrl(cssUrl)?.host ?? "CSS Font Source") : "CSS Font Source",
    sourceKind: "remote",
    sourceUrl: candidate.url,
    sourceLabel: cssUrl || candidate.url,
  };
}

function isGoogleFontsCssUrl(url) {
  const parsedUrl = tryCreateUrl(url);
  return parsedUrl?.host === "fonts.googleapis.com" && parsedUrl.pathname.startsWith("/css");
}

function googleFontsFamilySlug(familyName) {
  return String(familyName ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]/gu, "");
}

function parseAxisValue(value) {
  const rawValue = String(value ?? "").trim();
  if (rawValue.includes("..")) {
    const [minimum, maximum] = rawValue.split("..").map((item) => Number(item));
    if (Number.isFinite(minimum) && Number.isFinite(maximum)) {
      if (minimum <= 400 && 400 <= maximum) {
        return 400;
      }
      return Math.round((minimum + maximum) / 2);
    }
  }

  const numericValue = Number(rawValue);
  return Number.isFinite(numericValue) ? numericValue : rawValue;
}

function parseGoogleFontFamilySpec(familySpec) {
  const spec = String(familySpec ?? "");
  const separatorIndex = spec.indexOf(":");
  const familyName = (separatorIndex === -1 ? spec : spec.slice(0, separatorIndex)).trim();
  const axisSpec = separatorIndex === -1 ? "" : spec.slice(separatorIndex + 1);
  const request = {
    familyName,
    italic: false,
    weight: 400,
  };

  if (!axisSpec.includes("@")) {
    return request;
  }

  const [axisNamesText, axisValuesText] = axisSpec.split("@");
  const axisNames = axisNamesText.split(",").map((item) => item.trim()).filter(Boolean);
  const axisRows = axisValuesText.split(";").map((row) => row.split(",").map(parseAxisValue));
  const scoredRows = axisRows
    .map((values, index) => {
      const row = Object.fromEntries(axisNames.map((axisName, axisIndex) => [axisName, values[axisIndex]]));
      const rowItalic = Number(row.ital ?? 0) === 1;
      const rowWeight = Number(row.wght ?? 400);
      const score = (rowItalic ? 0 : 20) + (rowWeight === 400 ? 10 : 0) - Math.abs(rowWeight - 400) / 1000;
      return { row, index, score };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const selectedRow = scoredRows[0]?.row ?? {};

  request.italic = Number(selectedRow.ital ?? 0) === 1;
  request.weight = Number.isFinite(Number(selectedRow.wght)) ? Number(selectedRow.wght) : 400;
  return request;
}

function parseGoogleFontsRequest(cssUrl) {
  const parsedUrl = tryCreateUrl(cssUrl);
  if (!parsedUrl) {
    return [];
  }

  return parsedUrl.searchParams
    .getAll("family")
    .map(parseGoogleFontFamilySpec)
    .filter((request) => request.familyName);
}

async function fetchGoogleFontsDirectory(slug) {
  for (const licenseDir of GOOGLE_FONTS_REPO_LICENSE_DIRS) {
    const apiUrl = `${GOOGLE_FONTS_API_BASE_URL}/${licenseDir}/${slug}?ref=main`;
    const response = await fetch(apiUrl);
    if (response.status === 404) {
      continue;
    }
    if (!response.ok) {
      throw new Error(`Google Fonts metadata request failed: ${apiUrl}`);
    }

    const entries = await response.json();
    if (Array.isArray(entries)) {
      return { licenseDir, entries };
    }
  }

  return null;
}

function getGoogleFontFileAxes(fileName) {
  const match = /\[([^\]]+)\]/u.exec(fileName);
  return match ? match[1].toLowerCase().split(",").map((axis) => axis.trim()) : [];
}

function scoreGoogleFontFile(entry, request) {
  const fileName = String(entry.name ?? "");
  const lowerName = fileName.toLowerCase();
  if (!lowerName.endsWith(".ttf")) {
    return -Infinity;
  }

  let score = 0;
  const axes = getGoogleFontFileAxes(fileName);
  const isVariable = axes.length > 0;
  const isItalicFile = lowerName.includes("italic");

  score += isItalicFile === request.italic ? 30 : -30;
  if (isVariable) {
    score += 50;
    if (axes.includes("wght")) {
      score += 20;
    }
    return score;
  }

  const weightName = STATIC_WEIGHT_NAMES[Math.round(Number(request.weight) / 100) * 100] ?? "";
  if (weightName && lowerName.includes(weightName)) {
    score += 30;
  }
  if (Number(request.weight) === 400 && lowerName.includes("regular")) {
    score += 15;
  }
  if (Number(request.weight) === 700 && lowerName.includes("bold")) {
    score += 15;
  }

  return score;
}

function chooseGoogleFontFile(entries, request) {
  return entries
    .filter((entry) => String(entry.name ?? "").toLowerCase().endsWith(".ttf") && entry.download_url)
    .map((entry, index) => ({
      entry,
      index,
      score: scoreGoogleFontFile(entry, request),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.entry ?? null;
}

async function resolveGoogleFontsSource(cssUrl) {
  const requests = parseGoogleFontsRequest(cssUrl);
  const request = requests[0];
  if (!request) {
    throw new Error("No Google Fonts family was found in the URL.");
  }

  const slug = googleFontsFamilySlug(request.familyName);
  const directory = await fetchGoogleFontsDirectory(slug);
  if (!directory) {
    throw new Error(`Google Fonts family was not found in google/fonts: ${request.familyName}`);
  }

  const file = chooseGoogleFontFile(directory.entries, request);
  if (!file?.download_url) {
    throw new Error(`No TTF file was found for Google Fonts family: ${request.familyName}`);
  }

  const result = await fetchBytes(file.download_url, "ttf");
  return {
    bytes: result.bytes,
    format: result.format,
    fileName: file.name,
    familyName: request.familyName,
    fontStyle: request.italic ? "italic" : "normal",
    fontWeight: String(request.weight),
    provider: "Google Fonts",
    sourceKind: "remote",
    sourceUrl: file.download_url,
    sourceLabel: cssUrl,
  };
}

export async function resolveUserFontSource(input) {
  const source = String(input ?? "").trim();
  if (!source) {
    throw new Error("Font source URL is empty.");
  }

  if (/@font-face\b/iu.test(source)) {
    return resolveGenericCssFontSource(source);
  }

  const candidateUrls = extractCandidateUrls(source);
  if (candidateUrls.length === 0) {
    throw new Error("No font source URL was found.");
  }

  const directFontUrl = candidateUrls.find(isSupportedFontUrl);
  if (directFontUrl) {
    return resolveDirectFontUrl(directFontUrl);
  }

  const googleFontsUrl = candidateUrls.find(isGoogleFontsCssUrl);
  if (googleFontsUrl) {
    return resolveGoogleFontsSource(googleFontsUrl);
  }

  let lastError = null;
  for (const candidateUrl of candidateUrls) {
    try {
      const cssText = await fetchText(candidateUrl);
      return await resolveGenericCssFontSource(cssText, candidateUrl);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("No supported font source was found.");
}
