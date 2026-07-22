import * as THREE from "three";

const TEXTURE_URLS = Object.freeze({
  map: new URL(
    "../../assets/materials/light-gold-bl/lightgold_albedo.png",
    import.meta.url,
  ).href,
  metalnessMap: new URL(
    "../../assets/materials/light-gold-bl/lightgold_metallic.png",
    import.meta.url,
  ).href,
  normalMap: new URL(
    "../../assets/materials/light-gold-bl/lightgold_normal-ogl.png",
    import.meta.url,
  ).href,
  roughnessMap: new URL(
    "../../assets/materials/light-gold-bl/lightgold_roughness.png",
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

export function loadLightGoldTextures() {
  const loader = new THREE.TextureLoader();
  return {
    map: configureTexture(loader.load(TEXTURE_URLS.map), THREE.SRGBColorSpace),
    metalnessMap: configureTexture(loader.load(TEXTURE_URLS.metalnessMap)),
    normalMap: configureTexture(loader.load(TEXTURE_URLS.normalMap)),
    roughnessMap: configureTexture(loader.load(TEXTURE_URLS.roughnessMap)),
  };
}
