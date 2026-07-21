import { createKernelChapter } from "../chapters/kernel/index.js";

export const STORY_MAP = Object.freeze([
  Object.freeze({ id: "kernel", weight: 1, create: createKernelChapter }),
]);
