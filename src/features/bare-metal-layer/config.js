import { SYSTEM_LAYER_SIZE } from "../../objects/layers/system-layer-preset.js";

export const BARE_METAL_CONFIG = Object.freeze({
  ...SYSTEM_LAYER_SIZE,
  bottomY: -1.4,
  color: 0x0a1018,
  edgeColor: 0x5e9bcb,
  label: Object.freeze({
    title: "BARE METAL",
    description: "PHYSICAL MACHINE",
    width: 7,
    height: 0.88,
  }),
});
