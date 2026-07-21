import { SYSTEM_LAYER_SIZE } from "../../objects/layers/system-layer-preset.js";

export const UEFI_FIRMWARE_CONFIG = Object.freeze({
  color: 0x159ed8,
  glassColor: 0xd9f5ff,
  layerY: 0.12,
  surfaceOpacity: 0.24,
  finalSurfaceOpacity: 1,
  ...SYSTEM_LAYER_SIZE,
  signalCable: Object.freeze({
    cable: Object.freeze({
      radius: 0.042,
      tubularSegments: 112,
      radialSegments: 10,
      signalFade: 0.09,
      idleColor: 0x263d4b,
      poweredEmissiveStrength: 1.05,
      idleMetalness: 0.68,
      idleRoughness: 0.26,
    }),
    energyFlow: Object.freeze({
      count: 11,
      cableRadius: 0.042,
      ringOffset: 0.003,
      ringThickness: 0.008,
      color: 0xb8f2ff,
      opacity: 0.72,
    }),
    head: Object.freeze({
      scale: 0.13,
      fadeOutLength: 0.1,
      lightIntensity: 1.4,
      lightDistance: 1.15,
      turbulenceAmount: 0.05,
    }),
  }),
  services: Object.freeze([
    Object.freeze({
      id: "boot-manager",
      title: "BOOT MANAGER",
      position: Object.freeze([-1.85, 0.6, 0.9]),
      size: Object.freeze([1.85, 0.28, 0.72]),
    }),
    Object.freeze({
      id: "usb-boot-service",
      title: "USB BOOT",
      position: Object.freeze([1.85, 0.6, 0.9]),
      size: Object.freeze([1.95, 0.28, 0.72]),
    }),
  ]),
});
