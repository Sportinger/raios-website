import * as THREE from "three";

const TAU = Math.PI * 2;
const WAVES = Object.freeze([
  Object.freeze({ x: 1, y: 2, amplitude: 0.24, phase: 0.2 }),
  Object.freeze({ x: 2, y: -1, amplitude: 0.16, phase: 1.7 }),
  Object.freeze({ x: 3, y: 4, amplitude: 0.055, phase: 3.1 }),
  Object.freeze({ x: 7, y: -5, amplitude: 0.018, phase: 4.6 }),
]);

export function createProceduralGlassNormalMap(size = 256) {
  const data = new Uint8Array(size * size * 4);
  const normal = new THREE.Vector3();

  for (let y = 0; y < size; y += 1) {
    const v = y / size;
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      let slopeU = 0;
      let slopeV = 0;
      WAVES.forEach((wave) => {
        const angle = TAU * (wave.x * u + wave.y * v) + wave.phase;
        const derivative = wave.amplitude * TAU * Math.cos(angle);
        slopeU += derivative * wave.x;
        slopeV += derivative * wave.y;
      });
      normal.set(-slopeU, -slopeV, 5).normalize();
      const offset = (y * size + x) * 4;
      data[offset] = Math.round((normal.x * 0.5 + 0.5) * 255);
      data[offset + 1] = Math.round((normal.y * 0.5 + 0.5) * 255);
      data[offset + 2] = Math.round((normal.z * 0.5 + 0.5) * 255);
      data[offset + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  texture.name = "procedural-glass-normal-map";
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.75, 1.25);
  texture.needsUpdate = true;
  return texture;
}
