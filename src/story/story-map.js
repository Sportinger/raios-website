import { createKernelChapter } from "../chapters/kernel/index.js";
import { createPowerOnChapter } from "../chapters/power-on/index.js";

export const STORY_MAP = Object.freeze([
  Object.freeze({ id: "power-on", weight: 0.65, create: createPowerOnChapter }),
  Object.freeze({ id: "kernel", weight: 1, create: createKernelChapter }),
]);
