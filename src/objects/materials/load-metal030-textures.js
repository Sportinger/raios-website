import * as THREE from "three";

const TEXTURE_URLS = Object.freeze({
  map: new URL(
    "../../assets/materials/metal030/Metal030_1K-JPG_Color.jpg",
    import.meta.url,
  ).href,
  metalnessMap: new URL(
    "../../assets/materials/metal030/Metal030_1K-JPG_Metalness.jpg",
    import.meta.url,
  ).href,
  normalMap: new URL(
    "../../assets/materials/metal030/Metal030_1K-JPG_NormalGL.jpg",
    import.meta.url,
  ).href,
  roughnessMap: new URL(
    "../../assets/materials/metal030/Metal030_1K-JPG_Roughness.jpg",
    import.meta.url,
  ).href,
});

function loadTexture(loader, url, colorSpace = THREE.NoColorSpace) {
  const texture = loader.load(url);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.colorSpace = colorSpace;
  return texture;
}

export function loadMetal030Textures() {
  const loader = new THREE.TextureLoader();
  return {
    map: loadTexture(loader, TEXTURE_URLS.map, THREE.SRGBColorSpace),
    metalnessMap: loadTexture(loader, TEXTURE_URLS.metalnessMap),
    normalMap: loadTexture(loader, TEXTURE_URLS.normalMap),
    roughnessMap: loadTexture(loader, TEXTURE_URLS.roughnessMap),
  };
}
