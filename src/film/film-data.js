const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const FILM_DURATION = 134;
export const FILM_POSTER_TIME = 132;
export const FILM_PROMPT = "> build me a music player";

export const FILM_SCENES = deepFreeze([
  { number: 1, id: "sentence", title: "Prompt", start: 0, end: 3.89, act: 1, camera: { scale: 1.15, focusX: 0.5, focusY: 0.49 } },
  { number: 2, id: "world", title: "The world under the glass", start: 3.89, end: 12.59, act: 1, camera: { scale: 1.35, focusX: 0.3, focusY: 0.47 } },
  { number: 3, id: "net", title: "The agent needs the net", start: 12.59, end: 25, act: 1, camera: { scale: 1.35, focusX: 0.3, focusY: 0.47 } },
  { number: 4, id: "build-site", title: "Unlock the builder deck", start: 25, end: 33, act: 2, camera: { scale: 0.82, focusX: 0.5, focusY: 0.5 } },
  { number: 5, id: "inert-source", title: "Material becomes one workpiece", start: 33, end: 41, act: 2, camera: { scale: 1.02, focusX: 0.72, focusY: 0.48 } },
  { number: 6, id: "compiler", title: "Compiler round one", start: 41, end: 52, act: 2, camera: { scale: 1.12, focusX: 0.74, focusY: 0.49 } },
  { number: 7, id: "feedback", title: "Red report, precise fix", start: 52, end: 62, act: 2, camera: { scale: 0.98, focusX: 0.58, focusY: 0.49 } },
  { number: 8, id: "twins", title: "Twin build, byte equal", start: 62, end: 72, act: 2, camera: { scale: 1.08, focusX: 0.74, focusY: 0.49 } },
  { number: 9, id: "proof-cellar", title: "Harness tests in a disposable Shadow World", start: 72, end: 94, act: 2, camera: { scale: 1.08, focusX: 0.76, focusY: 0.51 } },
  { number: 10, id: "ring", title: "Guard binds report, hash, rights and owner", start: 94, end: 102, act: 3, camera: { scale: 1.28, focusX: 0.5, focusY: 0.49 } },
  { number: 11, id: "approval", title: "Guard opens the live door", start: 102, end: 110, act: 3, camera: { scale: 0.98, focusX: 0.58, focusY: 0.49 } },
  { number: 12, id: "running", title: "Player lands beside Genesis", start: 110, end: 120, act: 3, camera: { scale: 1.38, focusX: 0.57, focusY: 0.49 } },
  { number: 13, id: "compact-domain", title: "Player contracts to one private island", start: 120, end: 126, act: 3, camera: { scale: 1.18, focusX: 0.52, focusY: 0.45 } },
  { number: 14, id: "archipelago", title: "Every app becomes its own island", start: 126, end: 134, act: 3, camera: { scale: 0.64, focusX: 0.5, focusY: 0.49 } },
]);

export const FILM_TIMELINE_WAYPOINTS = deepFreeze([
  { number: 1, at: 3.89, title: "Rust kernel layer enters" },
  { number: 2, at: 8.28, title: "Rust kernel text complete" },
  { number: 3, at: 12.59, title: "Genesis layer and text complete" },
  { number: 4, at: 24.72, title: "Agent connected through the net door" },
  ...FILM_SCENES.slice(4).map(({ number, start: at, title }) => ({ number, at, title })),
]);

export const FILM_CAMERA_KEYFRAMES = deepFreeze([
  { at: 4.34, scale: 1.349527665317139, focusX: 0.48, focusY: 0.47 },
  { at: 6.93, scale: 1.5151515151515151, focusX: 0.24, focusY: 0.47 },
  { at: 13.06, scale: 1.700004177047695, focusX: 0.2477268412672603, focusY: 0.5086342063363015 },
  { at: 14.74, scale: 1.5151515151515151, focusX: 0.38, focusY: 0.59 },
  { at: 24.2, scale: 1.5625, focusX: 0.41, focusY: 0.61 },
  { at: 28.5, scale: 1.5625, focusX: 0.45236168080038514, focusY: 0.5064492247101696 },
  { at: 33.31, scale: 1.4285714285714286, focusX: 0.49, focusY: 0.59 },
  { at: 45.91, scale: 1.5873015873015872, focusX: 0.57, focusY: 0.48 },
  { at: 71.2, scale: 1.15, focusX: 0.73, focusY: 0.49 },
  { at: 77, scale: 1.24, focusX: 0.71, focusY: 0.5 },
  { at: 81.2, scale: 1.52, focusX: 0.73, focusY: 0.52 },
  { at: 83.5, scale: 1.16, focusX: 0.7, focusY: 0.5 },
  { at: 92, scale: 1.12, focusX: 0.68, focusY: 0.49 },
  { at: 93.95, scale: 1.5384615384615383, focusX: 0.61, focusY: 0.49 },
  { at: 95.26, scale: 1.0989010989010988, focusX: 0.48, focusY: 0.53 },
  { at: 100.41, scale: 1.0309278350515465, focusX: 0.48, focusY: 0.5 },
  { at: 102.44, scale: 1.639344262295082, focusX: 0.7, focusY: 0.39 },
  { at: 106.03, scale: 1.4492753623188408, focusX: 0.49, focusY: 0.34 },
  { at: 108.07, scale: 1.36986301369863, focusX: 0.52, focusY: 0.42 },
  { at: 120.55, scale: 1.18, focusX: 0.52, focusY: 0.45 },
  { at: 123.35, scale: 0.9, focusX: 0.5, focusY: 0.48 },
  { at: 126, scale: 0.68, focusX: 0.5, focusY: 0.49 },
  { at: 131.8, scale: 0.62, focusX: 0.5, focusY: 0.49 },
]);

export const FILM_ACTION_TIMINGS = deepFreeze({
  prompt: {
    call: { start: 0.08, end: 1.02 },
    fadeIn: { start: 0.08, end: 0.52 },
    typing: { start: 1.15, end: 3.72 },
    cursor: { start: 0.82, end: 5.15 },
    submittedAt: 5.1,
  },
  layers: {
    kernelOutline: { start: 3.89, end: 4.69 },
    kernelRise: { start: 4.69, end: 6.14 },
    genesisOutline: { start: 8.28, end: 9.08 },
    genesisRise: { start: 9.08, end: 10.58 },
    agentOutline: { start: 13.02, end: 13.62 },
    worldExpansion: { start: 13.02, end: 14.82 },
    agentRise: { start: 13.62, end: 14.82 },
    netOutline: { start: 14.82, end: 15.32 },
    netHatch: { start: 15.32, end: 15.77 },
    netRise: { start: 15.67, end: 16.62 },
    kernelSquareExpansion: { start: 24.72, end: 26.2 },
    builderFloorOnline: { start: 30.15, end: 31.15 },
  },
  network: {
    nodeOnlineAt: 16.62,
    connectedAt: 22.37,
  },
  compiler: {
    importCount: { start: 43.2, end: 48.4 },
    pageCount: { start: 43.2, end: 49.2 },
    activeWindows: [[42.25, 46], [53.25, 55.4], [67.5, 69.35]],
    successWindows: [[55.4, 56.05], [69.35, 70]],
    successDeliveries: [
      { start: 55.4, attach: 55.72, carry: 56.18, handoff: 57.8, end: 58.55 },
      { start: 69.35, attach: 69.67, carry: 70.1, handoff: 71.2, end: 71.95 },
    ],
    failureImprint: { start: 46, end: 52.55, punchSeconds: 0.15 },
    genesisImprintConsume: { start: 48.15, end: 49.55 },
    stomp: {
      crouch: 45.24,
      launch: 45.43,
      apex: 45.68,
      impact: 46,
      squashEnd: 46.18,
      settleEnd: 46.72,
    },
  },
  verification: {
    firstTwinBuild: { start: 57.8, end: 60.8 },
    mismatch: { start: 60.8, end: 66.95 },
    secondTwinBuild: { start: 78, end: 84.5 },
    reproducibilityLog: { revealAt: 78, start: 78, end: 84.5 },
    shadowWorldFuel: { start: 85.5, end: 93.2 },
  },
  approval: {
    ringAttachments: { manifest: 95.8, hash: 96.7, report: 97.55, ownerApproval: 98.55 },
    pointerTravel: { start: 96.15, end: 98.25 },
    pointerWindow: { start: 96, end: 99.4, fade: 0.3 },
    approvedAt: 98.55,
    remoteDenied: { start: 99, end: 101.2, fade: 0.24 },
    guardStep: { start: 98.55, end: 99.25 },
  },
  release: {
    shutdownOrder: { start: 106.15, end: 106.95 },
    liveGrantRevoke: { start: 106.15, end: 107 },
    playerAttachedAt: 106,
    builderReleasedAt: 109.8,
  },
  running: {
    trackProgress: { start: 111, end: 119.4 },
    neighborCrash: { start: 115.4, hiddenAt: 117.1, end: 118.3 },
  },
  archipelago: {
    domainContraction: { start: 120, end: 123 },
    legacyWorldFade: { start: 120, end: 122.7 },
    connection: { start: 120.45, end: 123.1 },
    islandPopSeconds: 0.62,
    routeDrawSeconds: 0.88,
    countFade: { start: 125.75, end: 126.45 },
  },
  finale: {
    cycles: { firstAt: 128.3, staggerSeconds: 0.48, duration: 0.35 },
    title: { start: 129, end: 133.45, fade: 0.65 },
    subtitle: { start: 129.35, end: 133.45, fade: 0.65 },
  },
});
