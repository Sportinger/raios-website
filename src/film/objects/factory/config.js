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

// The visible Builder Deck is owned by Foundation. By the time workshop
// programs appear, Foundation's one-sided world expansion has translated its
// root by (-1.9, +1). These coordinates map that settled, scaled top surface
// into the Factory root instead of the old hidden 16×10 prototype deck.
export const FACTORY_BUILDER_SURFACE = Object.freeze({
  id: "canonical-builder-factory-space",
  color: 0x111c2b,
  centerX: -1.615,
  centerZ: -2.36,
  width: FILM_QUADRANT_SIZE * FOUNDATION_PRESENTATION_SCALE,
  depth: FILM_QUADRANT_SIZE * FOUNDATION_PRESENTATION_SCALE,
  top: 0.57,
});

const BUILDER_HALF_SIZE = FACTORY_BUILDER_SURFACE.width / 2;
// Insets are reconstructed from the original 1200px SVG composition. The
// Compiler hugs the bottom vertex, while the wider right-side composition
// leaves the Tester farther inside the right vertex.
const COMPILER_CORNER_INSET = 0.95;
const TESTER_CORNER_INSET = 1.78;
const OUT_DOOR_ALONG = 0.8 * FOUNDATION_PRESENTATION_SCALE;
const GUARD_DOOR_INSET = 1.3;

export const FACTORY_SCENES = Object.freeze({
  builder: Object.freeze({ start: 25, end: 33 }),
  inert: Object.freeze({ start: 33, end: 41 }),
  compiler: Object.freeze({ start: 39, end: 110 }),
  feedback: Object.freeze({ start: 52, end: 62 }),
  twins: Object.freeze({ start: 62, end: 72 }),
  proof: Object.freeze({ start: 72, end: 94 }),
});

export const FACTORY_LANES = Object.freeze([
  Object.freeze({
    id: "compiler", title: "COMPILER",
    x: FACTORY_BUILDER_SURFACE.centerX + BUILDER_HALF_SIZE - COMPILER_CORNER_INSET,
    z: FACTORY_BUILDER_SURFACE.centerZ + BUILDER_HALF_SIZE - COMPILER_CORNER_INSET,
    scale: 1, revealAt: 39, lampCount: 1, progressLabel: "Compiling",
  }),
  Object.freeze({
    id: "verifier", title: "TESTER",
    x: FACTORY_BUILDER_SURFACE.centerX + BUILDER_HALF_SIZE - TESTER_CORNER_INSET,
    z: FACTORY_BUILDER_SURFACE.centerZ - BUILDER_HALF_SIZE + TESTER_CORNER_INSET,
    scale: 1, revealAt: 41.6, lampCount: 1, progressLabel: "Testing",
  }),
  Object.freeze({
    id: "guard", title: "GUARD",
    // Same projected axis as /out, one program-width inside the deck.
    x: FACTORY_BUILDER_SURFACE.centerX - BUILDER_HALF_SIZE + GUARD_DOOR_INSET,
    z: FACTORY_BUILDER_SURFACE.centerZ + OUT_DOOR_ALONG + GUARD_DOOR_INSET,
    scale: 1, revealAt: 41.9, lampCount: 3,
  }),
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
  inputDoor: Object.freeze({ edge: "left", along: -2.7 }),
  outputDoor: Object.freeze({ edge: "right", along: -2.7 }),
  recommendedWorldOffset: Object.freeze({ x: 7.895, y: 1.59, z: -5.895 }),
});
