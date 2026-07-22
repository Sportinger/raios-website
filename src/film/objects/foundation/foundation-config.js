const point = (x, y, z) => Object.freeze([x, y, z]);
const window = (start, end) => Object.freeze({ start, end });

export const FOUNDATION_LAYOUT = Object.freeze({
  kernel: point(-3.05, 0, 0),
  kernelExpanded: point(-0.4, 0, 0),
  networkExtension: point(6.4, -0.01, 1.5),
  genesisCompact: point(-3.05, 0.72, 0),
  genesis: point(-0.4, 0.72, 0),
  agentCompact: point(-2.0, 1.06, 0.87),
  agent: point(0.5, 1.06, 0.87),
  keyForge: point(0.85, 1.06, 0.2),
  netDoor: point(2.7, 1.06, 2.45),
  netTower: point(8.5, 0.72, 1.5),
  builder: point(6.53, 0.72, -6.93),
  buildDoor: point(1.95, 1.06, -2.35),
  production: point(4.43, 1.06, -6.93),
});

export const KERNEL_FOOTPRINT = Object.freeze({
  compact: Object.freeze({ width: 5.45, depth: 5.45 }),
  expanded: Object.freeze({ width: 9.15, depth: 9.15 }),
});

export const GENESIS_FOOTPRINT = Object.freeze({
  width: KERNEL_FOOTPRINT.expanded.width * (510 / 630),
  depth: KERNEL_FOOTPRINT.expanded.depth * (510 / 630),
});

export const NETWORK_EXTENSION_FOOTPRINT = Object.freeze({
  width: 5.2,
  depth: 3.2,
});

export const FOUNDATION_TIMELINE = Object.freeze({
  kernelRise: window(3.89, 6.14),
  genesisRise: window(8.28, 10.58),
  agentRise: window(13.02, 14.82),
  netRise: window(13.2, 14.6),
  agentRoute: window(15.02, 17.82),
  keyForgeRise: window(18.25, 18.85),
  netDoorRise: window(18.72, 19.72),
  netKey: Object.freeze({ start: 19.67, detach: 20.18, insert: 20.87, end: 21.57 }),
  netRoute: window(20.92, 22.37),
  networkConnectedAt: 22.37,
  buildRequestRoute: window(26.5, 27.4),
  builderRise: window(27.45, 28.45),
  buildDoorRise: window(27.45, 28.1),
  buildKey: Object.freeze({ start: 28, detach: 28.34, insert: 28.75, end: 29.2 }),
  builderRoute: window(28.75, 29.65),
  sourceRise: window(31.4, 31.95),
  workpieceRise: window(33, 34),
  assembly: window(34, 40),
});
