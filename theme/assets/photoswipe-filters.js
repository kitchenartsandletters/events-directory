const getObjectFitSize = (contains, containerWidth, containerHeight, width, height) => {
  const doRatio = width / height;
  const cRatio = containerWidth / containerHeight;
  const test = contains ? (doRatio > cRatio) : (doRatio < cRatio);

  let targetWidth = 0;
  let targetHeight = 0;

  if (test) {
      targetWidth = containerWidth;
      targetHeight = targetWidth / doRatio;
  } else {
      targetHeight = containerHeight;
      targetWidth = targetHeight * doRatio;
  }

  return {
      width: targetWidth,
      height: targetHeight,
      x: (containerWidth - targetWidth) / 2,
      y: (containerHeight - targetHeight) / 2
  };
}

const correctThumbBounds = (thumbBounds, itemData, index) => {
  const thumbnail = itemData.element.querySelector('img');
  const rect = thumbnail.getBoundingClientRect();
  const rectRatio = getObjectFitSize(true, thumbnail.width, thumbnail.height, thumbnail.naturalWidth, thumbnail.naturalHeight);
  const leftRatioAdjusted = rect.left + (rect.width / 2) - (rectRatio.width / 2);
  const topRatioAdjusted = rect.top + (rect.height / 2) - (rectRatio.height / 2);

  return {
    x: leftRatioAdjusted,
    y: topRatioAdjusted,
    w: rectRatio.width
  };
}

export { correctThumbBounds }
