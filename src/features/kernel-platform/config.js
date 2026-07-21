import { SYSTEM_LAYER_SIZE } from "../../objects/layers/system-layer-preset.js";

export const KERNEL_PLATFORM_CONFIG = Object.freeze({
  color: 0x07111c,
  source: Object.freeze([-1.45, 1.71, 0.72]),
  sourceSize: Object.freeze([2.25, 0.28, 0.76]),
  ...SYSTEM_LAYER_SIZE,
  hoverY: 2.35,
  landedY: -0.44,
});
