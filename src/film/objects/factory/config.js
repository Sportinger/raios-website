import {
  FILM_LAYER_HEIGHT,
  FILM_QUADRANT_SIZE,
  FOUNDATION_PRESENTATION_SCALE,
} from "../../layout-constants.js";

export const FACTORY_PALETTE = Object.freeze({
  ink: 0x07111d,
  panel: 0x13243a,
  panelLight: 0x1d3855,
  edge: 0x68b7ff,
  cyan: 0x28e0ff,
  blue: 0x4c82ff,
  green: 0x82f0ac,
  amber: 0xffc857,
  red: 0xff5573,
  violet: 0xad7cff,
  white: 0xeaf7ff,
});

export const FACTORY_SCENES = Object.freeze({
  builder: Object.freeze({ start: 25, end: 33 }),
  inert: Object.freeze({ start: 33, end: 41 }),
  compiler: Object.freeze({ start: 39, end: 96 }),
  feedback: Object.freeze({ start: 52, end: 62 }),
  twins: Object.freeze({ start: 62, end: 72 }),
  proof: Object.freeze({ start: 72, end: 80 }),
});

export const FACTORY_LANES = Object.freeze([
  Object.freeze({ id: "compiler", x: 2.411, z: 4.295, baseY: 0.286, scale: 0.96, revealAt: 39, color: FACTORY_PALETTE.cyan }),
  Object.freeze({ id: "verifier", x: 1.527, z: -3.395, baseY: 0.243, scale: 0.87, revealAt: 41.6, color: FACTORY_PALETTE.violet }),
  Object.freeze({ id: "guard", x: -5.565, z: 0.536, baseY: 0.269, scale: 0.83, revealAt: 41.9, color: FACTORY_PALETTE.green }),
]);

export const FACTORY_LAYOUT = Object.freeze({
  deck: Object.freeze({ width: 16, depth: 10, thickness: 0.72, gridStep: 2 }),
  hatch: Object.freeze({ width: 5.2, depth: 3.6 }),
  shadow: Object.freeze({
    width: FILM_QUADRANT_SIZE * FOUNDATION_PRESENTATION_SCALE,
    depth: FILM_QUADRANT_SIZE * FOUNDATION_PRESENTATION_SCALE,
    thickness: FILM_LAYER_HEIGHT * FOUNDATION_PRESENTATION_SCALE,
    gridStep: 2.1,
    // Aligns this Factory-owned deck with the upper cell of the Foundation
    // kernel after both authored root transforms have been applied.
    position: Object.freeze({ x: -14.37, y: -0.51, z: -2.36 }),
  }),
  inputDoor: Object.freeze({ x: -6.1, z: -2.7, yaw: Math.PI / 5 }),
  outputDoor: Object.freeze({ x: 6.1, z: -2.7, yaw: -Math.PI / 5 }),
  recommendedWorldOffset: Object.freeze({ x: 7.895, y: 1.59, z: -5.895 }),
});
