import { SYSTEM_LAYER_SIZE } from "../../objects/layers/system-layer-preset.js";

export const LIMINE_STAGE_CONFIG = Object.freeze({
  color: 0x0b1b29,
  source: Object.freeze([-1.85, 0.6, 0.9]),
  sourceSize: Object.freeze([1.85, 0.28, 0.72]),
  layer: Object.freeze({
    position: Object.freeze([0, 1.25, 0]),
    ...SYSTEM_LAYER_SIZE,
  }),
  zones: Object.freeze([
    Object.freeze({
      id: "config",
      title: "CONFIG",
      description: "SELECT BOOT ENTRY",
      x: 1.45,
    }),
    Object.freeze({
      id: "kernel-loader",
      title: "KERNEL LOADER",
      description: "LOAD ELF IMAGE",
      x: -1.45,
    }),
  ]),
});
