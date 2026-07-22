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
  compiler: Object.freeze({ start: 41, end: 80 }),
  feedback: Object.freeze({ start: 52, end: 62 }),
  twins: Object.freeze({ start: 62, end: 72 }),
  proof: Object.freeze({ start: 72, end: 80 }),
  guard: Object.freeze({ start: 80, end: 88 }),
  approval: Object.freeze({ start: 88, end: 96 }),
  running: Object.freeze({ start: 96, end: 106 }),
  compact: Object.freeze({ start: 106, end: 112 }),
  archipelago: Object.freeze({ start: 112, end: 120 }),
});

export const FACTORY_LANES = Object.freeze([
  Object.freeze({ id: "compiler", x: 1.2, z: 2.35, scale: 1, color: FACTORY_PALETTE.cyan }),
  Object.freeze({ id: "verifier", x: 5.15, z: -1.7, scale: 0.82, color: FACTORY_PALETTE.violet }),
  Object.freeze({ id: "guard", x: -4.25, z: -2.1, scale: 0.78, color: FACTORY_PALETTE.green }),
]);

export const FACTORY_LAYOUT = Object.freeze({
  deck: Object.freeze({ width: 16, depth: 10, thickness: 0.72, gridStep: 2 }),
  hatch: Object.freeze({ width: 5.2, depth: 3.6 }),
  shadow: Object.freeze({ width: 12, depth: 8, thickness: 0.72, gridStep: 2 }),
  inputDoor: Object.freeze({ x: -6.1, z: -2.7, yaw: Math.PI / 5 }),
  outputDoor: Object.freeze({ x: 6.1, z: -2.7, yaw: -Math.PI / 5 }),
});

const islandNames = [
  "player", "browser", "mail", "video", "photos", "notes", "files",
  "calendar", "maps", "chat", "terminal", "studio", "game-a", "game-b",
  "music", "reader", "vault", "settings", "camera", "store", "agent",
];

export const FACTORY_ISLANDS = Object.freeze(islandNames.map((id, index) => {
  const ring = index === 0 ? 0 : index <= 7 ? 1 : 2;
  const ringIndex = ring === 1 ? index - 1 : index - 8;
  const ringCount = ring === 1 ? 7 : 13;
  const angle = ring === 0 ? 0 : (ringIndex / ringCount) * Math.PI * 2 - Math.PI / 2;
  const radius = ring === 0 ? 0 : ring === 1 ? 5.3 : 10;
  return Object.freeze({
    id,
    index,
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius * 0.72,
    height: 0.7 + ((index * 7) % 5) * 0.12,
    color: [FACTORY_PALETTE.cyan, FACTORY_PALETTE.blue, FACTORY_PALETTE.violet,
      FACTORY_PALETTE.green, FACTORY_PALETTE.amber][index % 5],
  });
}));
