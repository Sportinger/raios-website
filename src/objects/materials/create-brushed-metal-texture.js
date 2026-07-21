import * as THREE from "three";

const TEXTURE_SIZE = 128;

function pseudoRandom(index) {
  const value = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function createBrushedMetalTexture() {
  const data = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE);

  for (let y = 0; y < TEXTURE_SIZE; y += 1) {
    const broadGrain = Math.sin(y * 0.31) * 13 + Math.sin(y * 1.73) * 5;

    for (let x = 0; x < TEXTURE_SIZE; x += 1) {
      const index = y * TEXTURE_SIZE + x;
      const fineGrain = (pseudoRandom(index) - 0.5) * 24;
      data[index] = THREE.MathUtils.clamp(128 + broadGrain + fineGrain, 72, 184);
    }
  }

  const texture = new THREE.DataTexture(
    data,
    TEXTURE_SIZE,
    TEXTURE_SIZE,
    THREE.RedFormat,
  );
  texture.name = "brushed-metal-roughness";
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 7);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}
