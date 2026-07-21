import * as THREE from "three";

const TAU = Math.PI * 2;
const WAVES = Object.freeze([
  Object.freeze({ x: 1, y: 2, amplitude: 0.24, phase: 0.2 }),
  Object.freeze({ x: 2, y: -1, amplitude: 0.16, phase: 1.7 }),
  Object.freeze({ x: 3, y: 4, amplitude: 0.055, phase: 3.1 }),
]);
const NOISE_OCTAVES = Object.freeze([
  Object.freeze({ frequency: 2, amplitude: 0.48 }),
  Object.freeze({ frequency: 5, amplitude: 0.25 }),
  Object.freeze({ frequency: 11, amplitude: 0.12 }),
  Object.freeze({ frequency: 23, amplitude: 0.055 }),
]);

function hashGrid(x, y, period) {
  const wrappedX = ((x % period) + period) % period;
  const wrappedY = ((y % period) + period) % period;
  let hash = Math.imul(wrappedX + 37, 374761393)
    ^ Math.imul(wrappedY + 71, 668265263);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967295;
}

function smooth(value) {
  return value * value * (3 - 2 * value);
}

function tileableValueNoise(u, v, frequency) {
  const x = u * frequency;
  const y = v * frequency;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const blendX = smooth(x - x0);
  const blendY = smooth(y - y0);
  const top = THREE.MathUtils.lerp(
    hashGrid(x0, y0, frequency),
    hashGrid(x0 + 1, y0, frequency),
    blendX,
  );
  const bottom = THREE.MathUtils.lerp(
    hashGrid(x0, y0 + 1, frequency),
    hashGrid(x0 + 1, y0 + 1, frequency),
    blendX,
  );
  return THREE.MathUtils.lerp(top, bottom, blendY) - 0.5;
}

function createHeightField(size, randomness) {
  const heights = new Float32Array(size * size);
  for (let y = 0; y < size; y += 1) {
    const v = y / size;
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const waveHeight = WAVES.reduce((height, wave) => (
        height + Math.sin(TAU * (wave.x * u + wave.y * v) + wave.phase)
          * wave.amplitude
      ), 0);
      const noiseHeight = NOISE_OCTAVES.reduce((height, octave) => (
        height + tileableValueNoise(u, v, octave.frequency) * octave.amplitude
      ), 0) * 1.4;
      heights[y * size + x] = THREE.MathUtils.lerp(
        waveHeight,
        noiseHeight,
        randomness,
      );
    }
  }
  return heights;
}

export function updateProceduralGlassNormalMap(texture, randomness) {
  const size = texture.image.width;
  const data = texture.image.data;
  const heights = createHeightField(
    size,
    THREE.MathUtils.clamp(randomness, 0, 1),
  );
  const normal = new THREE.Vector3();
  const heightAt = (x, y) => heights[
    (((y + size) % size) * size) + ((x + size) % size)
  ];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const slopeU = (heightAt(x + 1, y) - heightAt(x - 1, y)) * size * 0.5;
      const slopeV = (heightAt(x, y + 1) - heightAt(x, y - 1)) * size * 0.5;
      normal.set(-slopeU, -slopeV, 5).normalize();
      const offset = (y * size + x) * 4;
      data[offset] = Math.round((normal.x * 0.5 + 0.5) * 255);
      data[offset + 1] = Math.round((normal.y * 0.5 + 0.5) * 255);
      data[offset + 2] = Math.round((normal.z * 0.5 + 0.5) * 255);
      data[offset + 3] = 255;
    }
  }
  texture.needsUpdate = true;
}

export function createProceduralGlassNormalMap({
  randomness = 0.72,
  size = 128,
} = {}) {
  const texture = new THREE.DataTexture(
    new Uint8Array(size * size * 4),
    size,
    size,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  texture.name = "procedural-glass-normal-map";
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.75, 1.25);
  updateProceduralGlassNormalMap(texture, randomness);
  return texture;
}
