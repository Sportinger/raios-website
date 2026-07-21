import * as THREE from "three";

const TEXTURE_URLS = Object.freeze({
  map: new URL(
    "../../assets/materials/metal048a/Metal048A_1K-JPG_Color.jpg",
    import.meta.url,
  ).href,
  metalnessMap: new URL(
    "../../assets/materials/metal048a/Metal048A_1K-JPG_Metalness.jpg",
    import.meta.url,
  ).href,
  normalMap: new URL(
    "../../assets/materials/metal048a/Metal048A_1K-JPG_NormalGL.jpg",
    import.meta.url,
  ).href,
  roughnessMap: new URL(
    "../../assets/materials/metal048a/Metal048A_1K-JPG_Roughness.jpg",
    import.meta.url,
  ).href,
});

function configureTexture(texture, colorSpace = THREE.NoColorSpace) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.colorSpace = colorSpace;
  return texture;
}

export function loadMetal048ATextures() {
  const loader = new THREE.TextureLoader();
  return {
    map: configureTexture(loader.load(TEXTURE_URLS.map), THREE.SRGBColorSpace),
    metalnessMap: configureTexture(loader.load(TEXTURE_URLS.metalnessMap)),
    normalMap: configureTexture(loader.load(TEXTURE_URLS.normalMap)),
    roughnessMap: configureTexture(loader.load(TEXTURE_URLS.roughnessMap)),
  };
}
