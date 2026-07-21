export const PLASMA_PULSE_DEFAULTS = Object.freeze({
  scale: 0.52,
  fadeOutLength: 0.08,
  turbulenceAmount: 0.08,
  turbulenceFrequency: 24,
  lightIntensity: 3,
  lightDistance: 3.8,
  lightDecay: 2,
});

export function createPlasmaLayerSpecs(accentColor) {
  return [
    { blending: "normal", color: 0xf1fdff, opacity: 0.9, position: [0, 0, 0.04], rotation: 0.1, scale: [1.5, 1.25], spin: 4.5 },
    { color: 0xaeeeff, opacity: 0.15, position: [0.04, -0.03, -0.08], rotation: 0.8, scale: [2.1, 1.72], spin: -3.8 },
    { color: accentColor, opacity: 0.12, position: [-0.08, 0.06, -0.24], rotation: -0.55, scale: [3.5, 2.7], spin: 4.5 },
    { color: 0x3c91ff, opacity: 0.06, position: [0.12, -0.08, -0.42], rotation: 1.35, scale: [4.8, 3.5], spin: -3.8 },
    { color: 0x79cfff, opacity: 0.1, position: [-0.14, 0.09, -0.58], rotation: -1.1, scale: [1.7, 1.18], spin: 4.5 },
    { color: 0x3c91ff, opacity: 0.05, position: [0.13, -0.06, -0.82], rotation: 0.45, scale: [1.25, 0.82], spin: -3.8 },
    { color: 0x9cddff, opacity: 0.12, position: [0, 0, -0.1], rotation: 0, scale: [6.2, 0.3], spin: 0 },
  ];
}
