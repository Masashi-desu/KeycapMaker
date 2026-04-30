const DEFAULT_ALPHA_THRESHOLD = 4;
const DEFAULT_CONTENT_RATIO = 0.74;

function isPositiveNumber(value) {
  return Number.isFinite(value) && value > 0;
}

export function findOpaquePixelBounds(imageData, width, height, alphaThreshold = DEFAULT_ALPHA_THRESHOLD) {
  const data = imageData?.data ?? imageData;
  if (!data || !Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    return null;
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[((y * width + x) * 4) + 3];
      if (alpha <= alphaThreshold) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

export function expandPixelBounds(bounds, imageWidth, imageHeight, padding) {
  if (!bounds || !isPositiveNumber(imageWidth) || !isPositiveNumber(imageHeight)) {
    return null;
  }

  const safePadding = Math.max(0, Math.floor(Number(padding) || 0));
  const x = Math.max(0, bounds.x - safePadding);
  const y = Math.max(0, bounds.y - safePadding);
  const right = Math.min(imageWidth, bounds.x + bounds.width + safePadding);
  const bottom = Math.min(imageHeight, bounds.y + bounds.height + safePadding);

  return {
    x,
    y,
    width: Math.max(right - x, 1),
    height: Math.max(bottom - y, 1),
  };
}

export function createSquareThumbnailDrawPlan(sourceRect, targetSize, options = {}) {
  if (!sourceRect || !isPositiveNumber(targetSize) || sourceRect.width <= 0 || sourceRect.height <= 0) {
    return null;
  }

  const contentRatio = Math.min(Math.max(Number(options.contentRatio) || DEFAULT_CONTENT_RATIO, 0.1), 1);
  const maxContentSize = targetSize * contentRatio;
  const scale = Math.min(maxContentSize / sourceRect.width, maxContentSize / sourceRect.height);
  const width = Math.max(sourceRect.width * scale, 1);
  const height = Math.max(sourceRect.height * scale, 1);

  return {
    sourceX: sourceRect.x,
    sourceY: sourceRect.y,
    sourceWidth: sourceRect.width,
    sourceHeight: sourceRect.height,
    destinationX: (targetSize - width) / 2,
    destinationY: (targetSize - height) / 2,
    destinationWidth: width,
    destinationHeight: height,
  };
}
