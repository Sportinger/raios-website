export const HARDWARE_PLATFORM_CONFIG = Object.freeze({
  topY: -0.76,
  label: Object.freeze({
    title: "BARE METAL · PHYSICAL MACHINE",
    position: [0, -0.92, 2.611],
    size: [3.8, 0.38],
  }),
  spiFlash: Object.freeze({
    title: "SPI FLASH · UEFI IMAGE",
    position: [0, -0.6, 0],
    size: [1.55, 0.28, 0.58],
  }),
  usbPort: Object.freeze({
    position: [3.72, -0.87, 1.55],
    openingSize: [0.07, 0.17, 0.72],
  }),
  timing: Object.freeze({
    spiPower: Object.freeze([0, 0.24]),
    usbRead: Object.freeze([0.28, 0.76]),
  }),
});
