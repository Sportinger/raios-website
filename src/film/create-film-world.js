import * as THREE from "three";
import { disposeObject3D } from "../shared/dispose-object-3d.js";
import { createFoundationWorld } from "./objects/foundation/index.js";
import { createFactoryWorld } from "./objects/factory/index.js";

export function createFilmWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02070c);
  scene.fog = new THREE.FogExp2(0x02070c, 0.018);

  const root = new THREE.Group();
  root.name = "factory-film-world";
  const grid = new THREE.GridHelper(72, 72, 0x244c68, 0x102a3b);
  grid.position.y = -0.04;
  grid.material.transparent = true;
  grid.material.opacity = 0.28;
  const foundation = createFoundationWorld();
  const factory = createFactoryWorld();
  root.add(grid, foundation.group, factory.group);
  scene.add(root);

  const hemisphere = new THREE.HemisphereLight(0x9bdcff, 0x03070c, 1.65);
  const key = new THREE.DirectionalLight(0xd8efff, 3.2);
  key.position.set(12, 22, 10);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -34;
  key.shadow.camera.right = 34;
  key.shadow.camera.top = 34;
  key.shadow.camera.bottom = -34;
  const rim = new THREE.DirectionalLight(0x2d9de0, 1.5);
  rim.position.set(-18, 9, -12);
  scene.add(hemisphere, key, rim);

  return {
    scene,
    setTime(time) {
      foundation.setTime(time);
      factory.setTime(time);
    },
    dispose() {
      foundation.dispose();
      factory.dispose();
      disposeObject3D(root);
      root.removeFromParent();
      hemisphere.dispose();
      key.dispose();
      rim.dispose();
    },
  };
}
