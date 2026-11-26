export const DEFAULT_CAMERA_OFFSET = Object.freeze([1.42, 1.18, 1.32]);
const DESKTOP_DISTANCE_SCALE = Math.hypot(...DEFAULT_CAMERA_OFFSET);

export function isCompactPreviewViewport() {
  return window.innerWidth <= 760;
}

export function getDefaultPreviewDistanceScale() {
  return isCompactPreviewViewport() ? 4.2 : DESKTOP_DISTANCE_SCALE;
}

// Directions are in model space (+Z top, -Y front). Zoom is relative to the
// default distance for the current viewport, independent of the previous view.
export const FIELD_VIEW_PRESETS = Object.freeze({
  overview: { direction: [0.85, -1, 0.85], zoom: 0.84 },
  top: { direction: [0, -0.07, 1] },
  underside: { direction: [0, -0.18, -1], zoom: 1.28 },
  front: { direction: [0, -1, 0.32] },
  back: { direction: [0, 1, 0.32] },
  left: { direction: [-1, 0, 0.32] },
  right: { direction: [1, 0, 0.32] },
  "top-oblique": { direction: [0.4, -1, 0.8], zoom: 1.12 },
  "underside-oblique": { direction: [0.32, -0.54, -1], zoom: 1.18 },
  "top-front-left": { direction: [-0.65, -0.8, 1.25], zoom: 1.12 },
  "top-front-right": { direction: [0.65, -0.8, 1.25], zoom: 1.12 },
  "top-back-left": { direction: [-0.65, 0.8, 1.25], zoom: 1.12 },
  "top-back-right": { direction: [0.65, 0.8, 1.25], zoom: 1.12 },
});

export function getFieldPreviewDestination(field, currentView) {
  const preset = FIELD_VIEW_PRESETS[field?.previewView];
  if (!preset) return null;
  const destination = { ...currentView, direction: preset.direction, upAxis: "z" };
  if (field.previewZoom != null) destination.distanceScale = getDefaultPreviewDistanceScale() / field.previewZoom;
  return destination;
}
