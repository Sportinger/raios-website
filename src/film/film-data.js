const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const FILM_ANIMATION_DURATION = 148;
export const FILM_POSTER_ANIMATION_TIME = 146;
export const FILM_PROMPT = "> build me a music player";

export const FILM_SCENES = deepFreeze([
  { number: 1, id: "sentence", title: "Prompt", start: 0, end: 3.89, act: 1, camera: { scale: 1.15, focusX: 0.5, focusY: 0.49 } },
  { number: 2, id: "world", title: "The world under the glass", start: 3.89, end: 12.59, act: 1, camera: { scale: 1.35, focusX: 0.3, focusY: 0.47 } },
  { number: 3, id: "net", title: "The agent needs the net", start: 12.59, end: 25, act: 1, camera: { scale: 1.35, focusX: 0.3, focusY: 0.47 } },
  { number: 4, id: "build-site", title: "Unlock the builder layer", start: 25, end: 33, act: 2, camera: { scale: 0.82, focusX: 0.5, focusY: 0.5 } },
  { number: 5, id: "inert-source", title: "Material becomes one workpiece", start: 33, end: 41, act: 2, camera: { scale: 1.02, focusX: 0.72, focusY: 0.48 } },
  { number: 6, id: "compiler", title: "Compiler round one", start: 41, end: 52, act: 2, camera: { scale: 1.12, focusX: 0.74, focusY: 0.49 } },
  { number: 7, id: "feedback", title: "Red report, precise fix", start: 52, end: 71, act: 2, camera: { scale: 0.98, focusX: 0.58, focusY: 0.49 } },
  { number: 8, id: "twins", title: "Twin build, byte equal", start: 71, end: 81, act: 2, camera: { scale: 1.08, focusX: 0.74, focusY: 0.49 } },
  { number: 9, id: "proof-cellar", title: "Harness tests in a disposable Shadow World", start: 81, end: 108, act: 2, camera: { scale: 1.08, focusX: 0.76, focusY: 0.51 } },
  { number: 10, id: "ring", title: "Guard binds report, hash, rights and owner", start: 108, end: 116, act: 3, camera: { scale: 1.28, focusX: 0.5, focusY: 0.49 } },
  { number: 11, id: "approval", title: "Guard opens the live door", start: 116, end: 124, act: 3, camera: { scale: 0.98, focusX: 0.58, focusY: 0.49 } },
  { number: 12, id: "running", title: "Player lands beside Genesis", start: 124, end: 134, act: 3, camera: { scale: 1.38, focusX: 0.57, focusY: 0.49 } },
  { number: 13, id: "compact-domain", title: "Player contracts to one private island", start: 134, end: 140, act: 3, camera: { scale: 1.18, focusX: 0.52, focusY: 0.45 } },
  { number: 14, id: "archipelago", title: "Every app becomes its own island", start: 140, end: 148, act: 3, camera: { scale: 0.64, focusX: 0.5, focusY: 0.49 } },
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
  { at: 24.2, scale: 1.5625, focusX: 0.41, focusY: 0.61, yaw: 0 },
  { at: 28.5, scale: 1.5625, focusX: 0.45236168080038514, focusY: 0.5064492247101696, yaw: -28 },
  { at: 33.31, scale: 1.4285714285714286, focusX: 0.49, focusY: 0.59, yaw: -16 },
  { at: 39, scale: 1.4964456969391342, focusX: 0.5242086312573236, focusY: 0.5429631320211801, yaw: 0 },
  { at: 45.91, scale: 1.5873015873015872, focusX: 0.57, focusY: 0.48, yaw: 0 },
  { at: 57.6, scale: 1.469481289072342, focusX: 0.6131081163757093, focusY: 0.4826942572734818, yaw: 0 },
  { at: 64, scale: 1.350591672274458, focusX: 0.6566074752621947, focusY: 0.48541296720388716, yaw: 24 },
  { at: 70.4, scale: 1.2367399793522913, focusX: 0.6982635574638439, focusY: 0.4880164723414902, yaw: 0 },
  { at: 80.2, scale: 1.15, focusX: 0.73, focusY: 0.49, yaw: 0 },
  { at: 91, scale: 1.24, focusX: 0.71, focusY: 0.5, yaw: 12 },
  { at: 95.2, scale: 1.52, focusX: 0.73, focusY: 0.52, yaw: 22 },
  { at: 97.5, scale: 1.16, focusX: 0.7, focusY: 0.5, yaw: 28 },
  { at: 106, scale: 1.12, focusX: 0.68, focusY: 0.49, yaw: 38 },
  { at: 107.95, scale: 1.5384615384615383, focusX: 0.61, focusY: 0.49, yaw: 32 },
  { at: 109.26, scale: 1.0989010989010988, focusX: 0.48, focusY: 0.53, yaw: 27 },
  { at: 110.2, scale: 1.0929341544952489, focusX: 0.48, focusY: 0.5273664890864781, yaw: 22 },
  { at: 114.41, scale: 1.0309278350515465, focusX: 0.48, focusY: 0.5, yaw: 8 },
  { at: 116.44, scale: 1.639344262295082, focusX: 0.7, focusY: 0.39 },
  { at: 120.03, scale: 1.4492753623188408, focusX: 0.49, focusY: 0.34 },
  { at: 122.07, scale: 1.36986301369863, focusX: 0.52, focusY: 0.42 },
  { at: 134.55, scale: 1.18, focusX: 0.52, focusY: 0.45 },
  { at: 137.35, scale: 0.9, focusX: 0.5, focusY: 0.48 },
  { at: 140, scale: 0.68, focusX: 0.5, focusY: 0.49 },
  { at: 145.8, scale: 0.62, focusX: 0.5, focusY: 0.49 },
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
    activeWindows: [[42.25, 46], [53.25, 55.4], [76.5, 78.35]],
    successWindows: [[55.4, 56.05], [78.35, 79]],
    successDeliveries: [
      { start: 55.4, attach: 55.72, carry: 56.18, handoff: 57.8, end: 58.55 },
      { start: 78.35, attach: 78.67, carry: 79.1, handoff: 80.2, end: 80.95 },
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
    firstTwinBuild: { start: 57.8, end: 69.8 },
    mismatch: { start: 69.8, end: 75.95 },
    secondTwinBuild: { start: 92, end: 98.5 },
    reproducibilityLog: { revealAt: 92, start: 92, end: 98.5 },
    shadowWorldFuel: { start: 99.5, end: 107.2 },
  },
  approval: {
    ringAttachments: { manifest: 109.8, hash: 110.7, report: 111.55, ownerApproval: 112.55 },
    pointerTravel: { start: 110.15, end: 112.25 },
    pointerWindow: { start: 110, end: 113.4, fade: 0.3 },
    approvedAt: 112.55,
    remoteDenied: { start: 113, end: 115.2, fade: 0.24 },
    guardStep: { start: 112.55, end: 113.25 },
  },
  release: {
    shutdownOrder: { start: 120.15, end: 120.95 },
    liveGrantRevoke: { start: 120.15, end: 121 },
    playerAttachedAt: 120,
    builderReleasedAt: 123.8,
  },
  running: {
    trackProgress: { start: 125, end: 133.4 },
    neighborCrash: { start: 129.4, hiddenAt: 131.1, end: 132.3 },
  },
  archipelago: {
    domainContraction: { start: 134, end: 137 },
    firstIslandAt: 137.15,
    islandCount: 60,
    islandStaggerSeconds: 0.145,
    islandPopSeconds: 0.62,
    countFade: { start: 137.15, end: 137.8 },
  },
  finale: {
    title: { start: 143, end: 147.45, fade: 0.65 },
    subtitle: { start: 143.35, end: 147.45, fade: 0.65 },
  },
});
