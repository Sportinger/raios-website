const scene = (id, label) => Object.freeze({ id, label });

export const BOOT_PHASES = Object.freeze({
  firmware: scene("uefi-firmware", "UEFI Firmware"),
  bootUsb: scene("boot-usb", "raiOS Boot USB"),
  limineLoad: scene("limine-stage", "Limine"),
  kernelLoad: scene("kernel-load", "Kernel laden"),
  controlHandoff: scene("kernel-handoff", "Kontrollwechsel"),
  kernelLanding: scene("kernel-landing", "Kernel landet"),
});

export const BOOT_SCENES = Object.freeze(Object.values(BOOT_PHASES));
