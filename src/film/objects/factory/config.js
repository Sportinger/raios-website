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
  compiler: Object.freeze({ start: 39, end: 80 }),
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
  Object.freeze({ id: "compiler", x: 2.411, z: 4.295, baseY: 0.286, scale: 0.96, revealAt: 39, color: FACTORY_PALETTE.cyan }),
  Object.freeze({ id: "verifier", x: 1.527, z: -3.395, baseY: 0.243, scale: 0.87, revealAt: 41.6, color: FACTORY_PALETTE.violet }),
  Object.freeze({ id: "guard", x: -5.565, z: 0.536, baseY: 0.269, scale: 0.83, revealAt: 41.9, color: FACTORY_PALETTE.green }),
]);

export const FACTORY_LAYOUT = Object.freeze({
  deck: Object.freeze({ width: 16, depth: 10, thickness: 0.72, gridStep: 2 }),
  hatch: Object.freeze({ width: 5.2, depth: 3.6 }),
  shadow: Object.freeze({ width: 12, depth: 8, thickness: 0.72, gridStep: 2 }),
  inputDoor: Object.freeze({ x: -6.1, z: -2.7, yaw: Math.PI / 5 }),
  outputDoor: Object.freeze({ x: 6.1, z: -2.7, yaw: -Math.PI / 5 }),
  recommendedWorldOffset: Object.freeze({ x: 7.895, y: 1.59, z: -5.895 }),
});

const islandDefinitions = [
  ["music-player", "MUSIC PLAYER", "PLAY"],
  ["fortnite", "FORTNITE", "F"], ["browser", "BROWSER", "WEB"],
  ["docs", "DOCS", "DOC"], ["email", "EMAIL", "MAIL"],
  ["weather", "WEATHER", "SUN"], ["video-player", "VIDEO PLAYER", "PLAY"],
  ["minecraft", "MINECRAFT", "M"], ["messages", "MESSAGES", "CHAT"],
  ["files", "FILES", "DIR"], ["photos", "PHOTOS", "PIC"],
  ["maps", "MAPS", "MAP"], ["notes", "NOTES", "TXT"],
  ["calendar", "CALENDAR", "CAL"], ["camera", "CAMERA", "CAM"],
  ["contacts", "CONTACTS", "ID"], ["studio", "STUDIO", "EDIT"],
  ["terminal", "TERMINAL", "CLI"], ["store", "STORE", "GET"],
  ["settings", "SETTINGS", "CFG"], ["games", "GAMES", "PAD"],
];

export const FACTORY_ISLANDS = Object.freeze(islandDefinitions.map(([id, label, icon], index) => {
  const ring = index === 0 ? 0 : index <= 7 ? 1 : 2;
  const ringIndex = ring === 1 ? index - 1 : index - 8;
  const ringCount = ring === 1 ? 7 : 13;
  const angle = ring === 0 ? 0 : (ringIndex / ringCount) * Math.PI * 2 - Math.PI / 2;
  const radius = ring === 0 ? 0 : ring === 1 ? 5.3 : 10;
  return Object.freeze({
    id,
    label,
    icon,
    index,
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius * 0.72,
    height: 0.7 + ((index * 7) % 5) * 0.12,
    color: [FACTORY_PALETTE.cyan, FACTORY_PALETTE.blue, FACTORY_PALETTE.violet,
      FACTORY_PALETTE.green, FACTORY_PALETTE.amber][index % 5],
  });
}));
