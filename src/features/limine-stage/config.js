import { SYSTEM_LAYER_SIZE } from "../../objects/layers/system-layer-preset.js";

export const LIMINE_STAGE_CONFIG = Object.freeze({
  source: Object.freeze([-1.85, 0.6, 0.9]),
  sourceSize: Object.freeze([1.85, 0.28, 0.72]),
  layer: Object.freeze({
    position: Object.freeze([0, 1.25, 0]),
    ...SYSTEM_LAYER_SIZE,
  }),
  zones: Object.freeze([
    Object.freeze({
      id: "config",
      title: "CONFIG",
      description: "READ LIMINE.CONF",
      x: 2.2,
    }),
    Object.freeze({
      id: "kernel-loader",
      title: "KERNEL LOADER",
      description: "LOAD KERNEL.ELF",
      x: 0,
    }),
    Object.freeze({
      id: "handoff",
      title: "HANDOFF",
      description: "MEMORY MAP · FRAMEBUFFER · ACPI · STACK",
      x: -2.2,
    }),
  ]),
});
