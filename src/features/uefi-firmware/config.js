export const UEFI_FIRMWARE_CONFIG = Object.freeze({
  source: Object.freeze([0, -0.44, 0]),
  layerY: 0.12,
  width: 7.05,
  height: 0.14,
  depth: 4.85,
  services: Object.freeze([
    Object.freeze({
      id: "boot-manager",
      title: "BOOT MANAGER",
      description: "UEFI SERVICE",
      position: [-1.35, 0.28, 0.45],
      size: [1.55, 0.1, 0.72],
    }),
    Object.freeze({
      id: "usb-boot-service",
      title: "USB BOOT SERVICE",
      description: "TEMPORARY DRIVER",
      position: [1.7, 0.28, 1.05],
      size: [1.8, 0.1, 0.68],
    }),
  ]),
});
