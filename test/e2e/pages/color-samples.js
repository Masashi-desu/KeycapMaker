// Runs inside locator.evaluate; keep browser helpers within this function.
export function readContrastSamples(root, selector) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const rgba = (cssColor) => {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = cssColor;
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data];
  };
  const background = (element) => {
    const layers = [];
    for (let current = element; current; current = current.parentElement) {
      const color = rgba(getComputedStyle(current).backgroundColor);
      layers.push(color);
      if (color[3] === 255) break;
    }
    return layers.reverse().reduce((under, color) =>
      color.slice(0, 3).map((channel, index) => channel * color[3] / 255 + under[index] * (1 - color[3] / 255)), [255, 255, 255]);
  };
  return [...root.querySelectorAll(selector)]
    .filter((element) => element.getClientRects().length > 0)
    .map((element) => ({
      label: element.textContent.trim() || element.getAttribute("aria-label"),
      color: rgba(getComputedStyle(element).color).slice(0, 3),
      background: background(element),
    }));
}
