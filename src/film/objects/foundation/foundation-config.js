const point = (x, y, z) => Object.freeze([x, y, z]);
const window = (start, end) => Object.freeze({ start, end });

export const FOUNDATION_LAYOUT = Object.freeze({
  kernel: point(-3.05, 0, 0),
  kernelExpanded: point(-0.4, 0, 0),
  genesis: point(-3.05, 0.72, 0),
  agent: point(-3.85, 1.06, 0.65),
  keyForge: point(-2.15, 1.06, 0.05),
  netDoor: point(-0.85, 1.06, 1.72),
  netTower: point(1.75, 0.72, 2.55),
  builder: point(3.15, 0.72, 0),
  buildDoor: point(0.6, 1.06, 0.7),
  production: point(1.55, 1.06, 0.15),
});

export const KERNEL_FOOTPRINT = Object.freeze({
  compact: Object.freeze({ width: 5.8, depth: 5.1 }),
  expanded: Object.freeze({ width: 11.2, depth: 7.1 }),
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
