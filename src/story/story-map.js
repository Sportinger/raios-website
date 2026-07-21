import { createKernelChapter } from "../chapters/kernel/index.js";
import { createPowerOnChapter } from "../chapters/power-on/index.js";

export const STORY_MAP = Object.freeze([
  Object.freeze({
    id: "power-on",
    label: "Power on",
    weight: 1.15,
    create: createPowerOnChapter,
  }),
  Object.freeze({
    id: "kernel",
    label: "Rust Kernel",
    weight: 1,
    create: createKernelChapter,
  }),
]);
