import { SYSTEM_LAYER_SIZE } from "../../objects/layers/system-layer-preset.js";

export const BARE_METAL_CONFIG = Object.freeze({
  ...SYSTEM_LAYER_SIZE,
  bottomY: -1.4,
  color: 0x707a84,
  edgeColor: 0x6ca8d2,
  label: Object.freeze({
    title: "BARE METAL",
    width: 7,
    height: 0.88,
  }),
});
