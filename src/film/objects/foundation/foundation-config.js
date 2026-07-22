import {
  FILM_DOOR_SCALE,
  FILM_LAYER_HEIGHT,
  FILM_QUADRANT_SIZE,
  FOUNDATION_PRESENTATION_SCALE,
} from "../../layout-constants.js";

const point = (x, y, z) => Object.freeze([x, y, z]);
const door = (support, edge, along) => Object.freeze({ support, edge, along });
const window = (start, end) => Object.freeze({ start, end });

export const FOUNDATION_LAYER_HEIGHT = FILM_LAYER_HEIGHT;
export const FOUNDATION_DOOR_SCALE = FILM_DOOR_SCALE;

export const FOUNDATION_SURFACES = Object.freeze({
  kernel: Object.freeze({
    id: "kernel",
    color: 0x05080d,
    top: FOUNDATION_LAYER_HEIGHT,
  }),
  genesis: Object.freeze({
    id: "genesis",
    color: 0x101a28,
    centerX: -3.05 - (-1.9 / FOUNDATION_PRESENTATION_SCALE),
    centerZ: -(1 / FOUNDATION_PRESENTATION_SCALE),
    width: FILM_QUADRANT_SIZE,
    depth: FILM_QUADRANT_SIZE,
    top: FOUNDATION_LAYER_HEIGHT * 2,
  }),
  builder: Object.freeze({
    id: "builder",
    color: 0x111c2b,
    centerX: 6.72,
    centerZ: -9.17,
    width: FILM_QUADRANT_SIZE,
    depth: FILM_QUADRANT_SIZE,
    top: FOUNDATION_LAYER_HEIGHT * 2,
  }),
});

export const FOUNDATION_LAYOUT = Object.freeze({
  kernel: point(-3.05, 0, 0),
  expansionOffset: point(-1.9, 0, 1),
  genesisCompact: point(-3.05, FOUNDATION_LAYER_HEIGHT, 0),
  agentCompact: point(-2.0, FOUNDATION_LAYER_HEIGHT * 2, 0.87),
  keyForge: point(0.52, FOUNDATION_LAYER_HEIGHT * 2, -1.12),
  netDoor: door("genesis", "right", 2.65),
  netTower: point(8.65, FOUNDATION_LAYER_HEIGHT, 2.3),
  builder: point(6.72, FOUNDATION_LAYER_HEIGHT, -9.17),
  buildDoor: door("genesis", "right", 0.9),
  sysrootDoor: door("builder", "front", -2),
  srcDoor: door("builder", "front", 0.3),
  outDoor: door("builder", "left", 0.8),
  production: point(6.72, FOUNDATION_LAYER_HEIGHT * 2, -9.17),
});

export const KERNEL_FOOTPRINT = Object.freeze({
  compact: Object.freeze({ width: 8.5, depth: 8.5 }),
  expanded: Object.freeze({ width: 17, depth: 8.5 }),
  square: Object.freeze({ width: 17, depth: 17 }),
});

export const GENESIS_FOOTPRINT = Object.freeze({
  width: FILM_QUADRANT_SIZE,
  depth: FILM_QUADRANT_SIZE,
});

export const BUILDER_FOOTPRINT = GENESIS_FOOTPRINT;

export const FOUNDATION_TIMELINE = Object.freeze({
  kernelOutline: window(3.89, 4.69),
  kernelRise: window(4.69, 6.14),
  genesisOutline: window(8.28, 9.08),
  genesisRise: window(9.08, 10.58),
  worldExpansion: window(13.02, 14.82),
  agentOutline: window(13.02, 13.62),
  agentRise: window(13.62, 14.82),
  netOutline: window(14.82, 15.32),
  netHatch: window(15.32, 15.77),
  netRise: window(15.67, 16.62),
  agentRoute: window(15.02, 17.82),
  keyForgeRise: window(18.25, 18.85),
  netDoorRise: window(18.72, 19.72),
  netKey: Object.freeze({ start: 19.67, detach: 20.18, insert: 20.87, end: 21.57 }),
  netRoute: window(20.92, 22.37),
  networkConnectedAt: 22.37,
  kernelSquareExpansion: window(24.72, 26.2),
  buildRequestRoute: window(26.5, 27.4),
  builderOutline: window(26.65, 27.45),
  builderRise: window(27.45, 28.45),
  buildDoorRise: window(27.45, 28.1),
  buildKey: Object.freeze({ start: 28, detach: 28.34, insert: 28.75, end: 29.2 }),
  sysrootRoute: window(28.75, 29.65),
  sysrootDoorRise: window(29.65, 30.2),
  sysrootKey: Object.freeze({ start: 30.2, detach: 30.45, insert: 30.75, end: 31.1 }),
  srcRoute: window(30.75, 31.4),
  srcDoorRise: window(31.4, 31.95),
  srcKey: Object.freeze({ start: 31.95, detach: 32.2, insert: 32.5, end: 32.85 }),
  workpieceRoute: window(32.5, 33.65),
  outDoorRise: window(29.35, 29.95),
  builderFloorOnline: window(30.15, 31.15),
  workpieceRise: window(34, 37.2),
  materialMain: window(34, 37.3),
  materialCargo: window(34.8, 38.2),
  editOne: Object.freeze([
    window(49.95, 51.75),
    window(50.35, 52.15),
    window(50.75, 52.55),
  ]),
  editTwo: Object.freeze([
    window(64.4, 66.15),
    window(64.8, 66.55),
    window(65.2, 66.95),
  ]),
});
