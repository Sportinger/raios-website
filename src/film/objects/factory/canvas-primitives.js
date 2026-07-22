import * as THREE from "three";

export function createCanvasSprite(tracker, {
  pixelWidth,
  pixelHeight,
  worldWidth,
  worldHeight,
  renderOrder = 49,
} = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  const context = canvas.getContext("2d");
  const texture = tracker.texture(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = tracker.material(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  }));
  material.userData.preserveTransparency = true;
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(worldWidth, worldHeight, 1);
  sprite.renderOrder = renderOrder;
  return { canvas, context, texture, material, sprite };
}

export function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}
