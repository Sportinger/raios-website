import { SYSTEM_LAYER_SIZE } from "../../objects/layers/system-layer-preset.js";

export const LIMINE_STAGE_CONFIG = Object.freeze({
  color: 0x0b1b29,
  layer: Object.freeze({
    position: Object.freeze([0, 1.25, 0]),
    ...SYSTEM_LAYER_SIZE,
  }),
  zone: Object.freeze({
    size: Object.freeze([2.25, 0.28, 0.76]),
    z: 0.72,
  }),
  zones: Object.freeze([
    Object.freeze({
      id: "config",
      title: "CONFIG",
      x: 1.45,
    }),
    Object.freeze({
      id: "kernel-loader",
      title: "KERNEL LOADER",
      x: -1.45,
    }),
  ]),
});
