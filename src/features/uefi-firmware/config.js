import { SYSTEM_LAYER_SIZE } from "../../objects/layers/system-layer-preset.js";

export const UEFI_FIRMWARE_CONFIG = Object.freeze({
  source: Object.freeze([0, -0.6, 0]),
  sourceSize: Object.freeze([1.55, 0.28, 0.58]),
  layerY: 0.12,
  surfaceOpacity: 0.28,
  finalSurfaceOpacity: 0.9,
  ...SYSTEM_LAYER_SIZE,
  services: Object.freeze([
    Object.freeze({
      id: "boot-manager",
      title: "BOOT MANAGER",
      description: "SELECT EFI ENTRY",
      position: [-1.85, 0.6, 0.9],
      size: [1.85, 0.28, 0.72],
    }),
    Object.freeze({
      id: "usb-boot-service",
      title: "USB BOOT",
      description: "MASS STORAGE · FAT32",
      position: [1.85, 0.6, 0.9],
      size: [1.95, 0.28, 0.72],
    }),
  ]),
});
