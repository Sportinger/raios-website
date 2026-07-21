import { SYSTEM_LAYER_SIZE } from "../../objects/layers/system-layer-preset.js";

export const BARE_METAL_CONFIG = Object.freeze({
  ...SYSTEM_LAYER_SIZE,
  bottomY: -1.4,
  color: 0xaeb7c0,
  edgeColor: 0x6f9fbe,
  label: Object.freeze({
    title: "BARE METAL",
    width: 7,
    height: 0.88,
  }),
});
