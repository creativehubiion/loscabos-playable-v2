/**
 * Utility to detect device type and calculate scale factors and offsets for a Phaser game.
 *
 * @param {Phaser.Scene} scene - The current Phaser scene.
 * @param {boolean} useRootCanvas - Whether to use the root canvas dimensions.
 * @returns {Object} An object containing scaleFactor, topMarginOffset, and leftMarginOffsetPercentage.
 */
export function getScaleUtils(scene, useRootCanvas) {
  // Device detection
  const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);
  const isIphoneDevice = /iPhone/i.test(navigator.userAgent);

  // Window dimensions
  const windowDimensions = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  let canvasWidth, canvasHeight;

  // Determine canvas dimensions
  if (useRootCanvas) {
    canvasWidth = scene.game.canvas.width;
    canvasHeight = scene.game.canvas.height;
  } else {
    canvasWidth = scene.sys.game.canvas.width;
    canvasHeight = scene.sys.game.canvas.height;
  }

  // Calculate extra offsets from canvas styles
  const canvasElement = document.getElementsByTagName("canvas")[0];
  const topMarginOffset =
    (Math.abs(parseFloat(canvasElement.style.marginTop || 0)) /
      windowDimensions.width) *
    canvasWidth +
    (isIphoneDevice ? 130 : 0);
  const leftMarginOffsetPercentage =
    (Math.abs(parseFloat(canvasElement.style.marginLeft || 0)) /
      windowDimensions.height) *
    canvasHeight;

  // Calculate scale factor
  let scaleFactor =
    (windowDimensions.height /
      (windowDimensions.width + leftMarginOffsetPercentage * 2)) *
    0.85;

  // Adjustments for non-mobile devices
  if (!isMobileDevice) {
    scaleFactor = 1.4;
    return {
      canvasWidth,
      canvasHeight, scaleFactor, topMarginOffset: 0, leftMarginOffsetPercentage: 0
    };
  }
  /* scaleFactor = (scaleFactor / 3) * 2 */
  return {
    canvasWidth,
    canvasHeight,
    scaleFactor,
    topMarginOffset,
    leftMarginOffsetPercentage,
    isMobileDevice,
    isIphoneDevice,
  };
}
