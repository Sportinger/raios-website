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
  compiler: Object.freeze({ start: 41, end: 52 }),
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
  Object.freeze({ id: "compiler", x: -5.2, color: FACTORY_PALETTE.cyan }),
  Object.freeze({ id: "verifier", x: 0, color: FACTORY_PALETTE.violet }),
  Object.freeze({ id: "guard", x: 5.2, color: FACTORY_PALETTE.green }),
]);

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
