import * as THREE from "three";

const TEXTURE_URLS = Object.freeze({
  map: new URL(
    "../../assets/materials/metal054a/Metal054A_2K-JPG_Color.jpg",
    import.meta.url,
  ).href,
  metalnessMap: new URL(
    "../../assets/materials/metal054a/Metal054A_2K-JPG_Metalness.jpg",
    import.meta.url,
  ).href,
  normalMap: new URL(
    "../../assets/materials/metal054a/Metal054A_2K-JPG_NormalGL.jpg",
    import.meta.url,
  ).href,
  roughnessMap: new URL(
    "../../assets/materials/metal054a/Metal054A_2K-JPG_Roughness.jpg",
    import.meta.url,
  ).href,
});

function configureTexture(
  texture,
  colorSpace = THREE.NoColorSpace,
  repeat = [1, 1],
) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.fromArray(repeat);
  texture.anisotropy = 8;
  texture.colorSpace = colorSpace;
  return texture;
}

export function loadMetal054ATextures({ repeat = [1, 1] } = {}) {
  const loader = new THREE.TextureLoader();
  return {
    map: configureTexture(
      loader.load(TEXTURE_URLS.map),
      THREE.SRGBColorSpace,
      repeat,
    ),
    metalnessMap: configureTexture(
      loader.load(TEXTURE_URLS.metalnessMap),
      THREE.NoColorSpace,
      repeat,
    ),
    normalMap: configureTexture(
      loader.load(TEXTURE_URLS.normalMap),
      THREE.NoColorSpace,
      repeat,
    ),
    roughnessMap: configureTexture(
      loader.load(TEXTURE_URLS.roughnessMap),
      THREE.NoColorSpace,
      repeat,
    ),
  };
}
