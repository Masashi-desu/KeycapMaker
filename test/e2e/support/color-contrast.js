export function contrastRatio(color, background) {
  const luminance = (rgb) => rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const foreground = luminance(color);
  const surface = luminance(background);
  return (Math.max(foreground, surface) + 0.05) / (Math.min(foreground, surface) + 0.05);
}
