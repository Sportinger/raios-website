import {
  BOOT_SEQUENCE_WEIGHT,
  createBootSequenceChapter,
} from "../chapters/boot-sequence/index.js";
import { createPowerOnChapter } from "../chapters/power-on/index.js";

export const STORY_MAP = Object.freeze([
  Object.freeze({
    id: "power-on",
    label: "Power on",
    weight: 1.15,
    create: createPowerOnChapter,
  }),
  Object.freeze({
    id: "boot-sequence",
    label: "Boot sequence",
    weight: BOOT_SEQUENCE_WEIGHT,
    create: createBootSequenceChapter,
  }),
]);
