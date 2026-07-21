import { SYSTEM_LAYER_SIZE } from "../../objects/layers/system-layer-preset.js";

export const RUST_KERNEL_CONFIG = Object.freeze({
  baseY: -0.76,
  columns: 3,
  rows: 2,
  gap: 0.22,
  mergedLabel: "RUST KERNEL",
  survivalLabel: "RUST KERNEL · SURVIVAL CORE",
  layer: Object.freeze({
    ...SYSTEM_LAYER_SIZE,
    color: 0x080d15,
    edgeColor: 0x38526f,
    outlineColor: 0x6d9dce,
    metalness: 0.42,
    roughness: 0.5,
  }),
});
