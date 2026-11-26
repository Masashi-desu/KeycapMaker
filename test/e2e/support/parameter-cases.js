import profiles, { DEFAULT_SHAPE_PROFILE_KEY } from "../../../src/data/keycap-shape-registry.js";

// Composite and browser-only controls supplement the shape registry's field groups.
export const unitFields = {
  keySizeUnits: "keyWidth",
  keyDepthUnits: "keyDepth",
  topHatTopWidthUnits: "topHatTopWidth",
  topHatTopDepthUnits: "topHatTopDepth",
  topHatBottomWidthUnits: "topHatBottomWidth",
  topHatBottomDepthUnits: "topHatBottomDepth",
};
const children = { keyWidth: ["keyUnitMm"], wallThickness: ["topThickness"] };
for (const [unitKey, primary] of Object.entries(unitFields)) {
  (children[primary] ??= []).push(unitKey);
}
for (const key of ["topCornerRadius", "topHatTopRadius", "topHatBottomRadius"]) {
  children[key] = ["IndividualEnabled", "LeftTop", "RightTop", "LeftBottom", "RightBottom"].map(suffix => key + suffix);
}

const cases = new Map([["name", { key: "name", profile: DEFAULT_SHAPE_PROFILE_KEY }]]);
for (const profile of profiles.profiles) {
  for (const { id: group, fieldKeys } of profile.fieldGroups) {
    for (const parent of fieldKeys) {
      for (const key of [parent, ...(children[parent] ?? [])]) {
        if (!cases.has(key)) cases.set(key, { key, profile: profile.key, group });
      }
    }
  }
}
export const parameterCases = [...cases.values()];

export function legendPrefix(key) {
  return key.match(/^(legend|topLegend(?:Left|Right)(?:Top|Bottom)|sideLegend(?:Front|Back|Left|Right))/)?.[0];
}

// Set up only the dependencies of the control being measured.
export function prerequisites({ key, profile, group }) {
  const params = {};
  if (profile !== DEFAULT_SHAPE_PROFILE_KEY) params.shapeProfile = profile;
  if (group === "legend") {
    const prefix = legendPrefix(key);
    if (prefix !== "legend" && key !== prefix + "Enabled") params[prefix + "Enabled"] = true;
    if (key.includes("Icon")) params[prefix + "ContentType"] = "icon";
    if (key.endsWith("IconFill")) params[prefix + "IconSet"] = "material-symbols";
  }
  if (group === "topHat" && key !== "topHatEnabled") params.topHatEnabled = true;
  if (key === "topHatColor") params.topHatSeparateColorEnabled = true;
  if (key === "topHatDishDepth") params.topHatSurfaceShape = "cylindrical";
  if (key === "dishDepth") params.topSurfaceShape = "cylindrical";
  if (/^top(Front|Back|Left|Right)Height$/.test(key)) params.topSlopeInputMode = "edge-height";
  const corner = key.match(/^(.*Radius)(LeftTop|RightTop|LeftBottom|RightBottom)$/);
  if (corner) params[corner[1] + "IndividualEnabled"] = true;
  // Leave room to edit the bottom size without clamping it to the top or skirt.
  if (/^topHatBottom(Width|Depth)/.test(key)) Object.assign(params, { topHatTopWidth: 8, topHatTopDepth: 8 });
  if (key === "jStemLp01PreviewColor") params.stemType = "j_stem_lp01";
  return params;
}

const values = {
  name: "Performance sample", shapeProfile: "typewriter", keyUnitMm: 20, keySizeUnits: 1.25, keyDepthUnits: 1.25,
  topHatTopWidthUnits: 0.5, topHatTopDepthUnits: 0.5, topHatBottomWidthUnits: 0.65, topHatBottomDepthUnits: 0.65,
  keyWidth: 19, keyDepth: 19, topCenterHeight: 10, wallThickness: 1.3, topThickness: 1.6, topScale: 0.8,
  keycapShoulderRadius: 0.2, keycapEdgeRadius: 0.2, topSurfaceShape: "cylindrical", dishDepth: 0.6,
  topSlopeInputMode: "edge-height", topPitchDeg: 2, topRollDeg: 2, topOffsetX: 0.2, topOffsetY: 0.2,
  topFrontHeight: 10, topBackHeight: 10, topLeftHeight: 10, topRightHeight: 10,
  topHatSurfaceShape: "cylindrical", topHatDishDepth: 0.6, topHatTopWidth: 9, topHatTopDepth: 9,
  topHatBottomWidth: 12, topHatBottomDepth: 12, topHatHeight: 1, topHatShoulderAngle: 50, topHatShoulderRadius: 0.2,
  jisEnterNotchWidth: 5, jisEnterNotchDepth: 17, topHatInset: 1.5, typewriterCornerRadius: 6, typewriterMountHeight: 12,
  rimWidth: 1.2, rimHeightUp: 0.6, rimHeightDown: 0.6, homingBarLength: 4.2, homingBarWidth: 1.4,
  homingBarHeight: 0.7, homingBarChamfer: 0.2, homingBarOffsetY: -3, stemType: "mx", jStemLp01PreviewColor: "orange",
  stemOuterDelta: 0.02, stemCrossMargin: 0.06, stemCrossChamfer: 0.1, stemInsetDelta: 0.1,
};
const legendValues = {
  ContentType: "icon", IconSet: "material-symbols", IconName: "star", Text: "K", FontKey: "bangers-regular",
  FontStyleKey: "bold", Size: 4.5, OutlineDelta: 0.1, Height: 0.2, Embed: 0.4, OffsetX: 0.4, OffsetY: 0.4,
};

export function changedValue(key, current) {
  if (typeof current === "boolean") return !current;
  if (Object.hasOwn(values, key)) return values[key];
  if (key.endsWith("Color")) return "#3579ab";
  if (/^(topCornerRadius|topHat(Top|Bottom)Radius)/.test(key)) return 1.2;
  const value = legendValues[key.slice(legendPrefix(key)?.length)];
  if (value === undefined) throw new Error(`Choose a representative edit for ${key}`);
  return value;
}
