const segment = (start, end) => Object.freeze([start, end]);

export const BOOT_TIMELINE = Object.freeze({
  hardware: Object.freeze({
    firmwareRetired: segment(0.55, 1),
  }),
  uefi: Object.freeze({
    pattern: segment(0, 0.62),
    layer: segment(0, 0.78),
    initialOpacityBoost: segment(0.78, 1),
    opacityBoost: segment(0, 0.5),
    usbService: segment(0.72, 1),
    bootManager: segment(0.58, 0.76),
    usbPath: segment(0.32, 0.66),
    bootManagerPath: segment(0.58, 0.88),
    cableRetreat: segment(0, 0.2),
    retreat: segment(0.4, 1),
  }),
  usb: Object.freeze({
    insert: segment(0, 0.42),
    search: segment(0.32, 0.66),
  }),
  limine: Object.freeze({
    layer: segment(0, 0.72),
    config: segment(0.72, 1),
    kernelLoader: segment(0, 0.28),
    handoff: segment(0, 0.32),
    retreat: segment(0.2, 0.72),
  }),
  kernel: Object.freeze({
    assembly: segment(0.32, 1),
    landing: segment(0.12, 0.82),
    handoffRunning: segment(0, 0.4),
    landedRunning: segment(0.72, 1),
  }),
});
