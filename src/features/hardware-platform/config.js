export const HARDWARE_PLATFORM_CONFIG = Object.freeze({
  spiFlash: Object.freeze({
    title: "SPI FLASH",
    color: 0x0a1018,
    position: Object.freeze([0, -0.6, 0]),
    size: Object.freeze([1.55, 0.28, 0.58]),
  }),
  usbPort: Object.freeze({
    position: Object.freeze([3.72, -0.87, 1.55]),
    openingSize: Object.freeze([0.07, 0.17, 0.72]),
  }),
  timing: Object.freeze({
    spiPower: Object.freeze([0, 0.24]),
    usbRead: Object.freeze([0.28, 0.76]),
  }),
});
