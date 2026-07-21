import * as THREE from "three";
import { applyBoxTextureScale } from "../materials/apply-box-texture-scale.js";
import { loadMetal030Textures } from "../materials/load-metal030-textures.js";

const TABLE_SIZE = Object.freeze({
  depth: 34,
  height: 0.5,
  tileSize: 3,
  width: 42,
});

export const TABLE_SURFACE_Y = -1.2;

export function createTableSurface() {
  const geometry = new THREE.BoxGeometry(
    TABLE_SIZE.width,
    TABLE_SIZE.height,
    TABLE_SIZE.depth,
  );
  applyBoxTextureScale(geometry, TABLE_SIZE);
  const textures = loadMetal030Textures();
  const material = new THREE.MeshStandardMaterial({
    color: 0xb8bec4,
    map: textures.map,
    metalness: 1,
    metalnessMap: textures.metalnessMap,
    normalMap: textures.normalMap,
    normalScale: new THREE.Vector2(0.34, 0.34),
    roughness: 1,
    roughnessMap: textures.roughnessMap,
  });
  const table = new THREE.Mesh(geometry, material);
  table.name = "metal-work-table";
  table.position.set(
    4,
    TABLE_SURFACE_Y - TABLE_SIZE.height / 2,
    4,
  );
  table.receiveShadow = true;
  return table;
}
