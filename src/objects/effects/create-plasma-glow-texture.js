import * as THREE from "three";

const clamp01 = (value) => Math.min(1, Math.max(0, value));

// Gauß-Glocke, die bei distance = 1 exakt auf 0 ausläuft: kein Plateau,
// keine harte Kante und kein sichtbarer Sprite-Rahmen.
function softBell(distance, sharpness) {
  const rim = Math.exp(-sharpness);
  return clamp01((Math.exp(-distance * distance * sharpness) - rim) / (1 - rim));
}

export function createPlasmaGlowTexture(size = 96) {
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = ((x + 0.5) / size) * 2 - 1;
      const ny = ((y + 0.5) / size) * 2 - 1;
      const angle = Math.atan2(ny, nx);
      const distance = Math.hypot(nx, ny);
      const falloff = clamp01(1 - distance);

      const core = softBell(distance, 22);
      const halo = softBell(distance, 4);
      const wobble = 1 + falloff * (
        Math.sin(angle * 3 + 0.7) * 0.1
        + Math.sin(angle * 7 - 1.1) * 0.06
        + Math.sin(angle * 11 + 2.2) * 0.03
      );
      const filaments = 1 + falloff * 0.16 * Math.sin(
        nx * 15 + Math.sin(ny * 9) * 2.6,
      );
      // Weiche Sättigung statt hartem Clip: nähert sich asymptotisch der 1.
      const energy = core * 0.95 + halo * wobble * filaments * 0.6;
      const alpha = 1 - Math.exp(-energy * 1.35);

      const offset = (y * size + x) * 4;
      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[offset + 3] = Math.round(alpha * 255);
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
