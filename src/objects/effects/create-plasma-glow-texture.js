import * as THREE from "three";

export function createPlasmaGlowTexture(size = 96) {
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = ((x + 0.5) / size) * 2 - 1;
      const ny = ((y + 0.5) / size) * 2 - 1;
      const angle = Math.atan2(ny, nx);
      const distance = Math.hypot(nx, ny);
      const edge = 1
        + Math.sin(angle * 3 + 0.7) * 0.13
        + Math.sin(angle * 7 - 1.1) * 0.08
        + Math.sin(angle * 11 + 2.2) * 0.04;
      const density = Math.max(0, 1 - distance / edge);
      const denseCore = Math.max(0, 1 - distance / 0.52);
      const filaments = 0.78 + 0.22 * Math.sin(
        nx * 15 + Math.sin(ny * 9) * 2.6,
      );
      const alpha = Math.max(
        Math.pow(density, 1.75) * filaments,
        Math.pow(denseCore, 0.42),
      );
      const offset = (y * size + x) * 4;
      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[offset + 3] = Math.round(Math.max(0, alpha) * 255);
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
