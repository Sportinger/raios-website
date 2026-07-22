import * as THREE from "three";
import { disposeObject3D } from "../shared/dispose-object-3d.js";
import { FOUNDATION_PRESENTATION_SCALE } from "./layout-constants.js";
import { createFoundationWorld } from "./objects/foundation/index.js";
import { createFactoryWorld } from "./objects/factory/index.js";

export function createFilmWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x010407);

  const root = new THREE.Group();
  root.name = "factory-film-world";
  const grid = new THREE.GridHelper(72, 72, 0x244c68, 0x102a3b);
  grid.position.y = 0;
  grid.material.transparent = true;
  grid.material.opacity = 0.28;
  const foundation = createFoundationWorld();
  const factory = createFactoryWorld();
  // The native meshes use compact modeling units. This authored transform maps
  // the Foundation set back onto the original SVG composition while preserving
  // real depth for a future orbit camera.
  foundation.group.scale.setScalar(FOUNDATION_PRESENTATION_SCALE);
  foundation.group.position.set(-1.9, 0, 4.5);
  foundation.group.userData.presentationBaseX = foundation.group.position.x;
  foundation.group.userData.presentationBaseZ = foundation.group.position.z;
  const factoryOffset = factory.group.userData.recommendedWorldOffset;
  factory.group.position.set(factoryOffset.x, factoryOffset.y, factoryOffset.z);
  root.add(grid, foundation.group, factory.group);
  scene.add(root);

  return {
    scene,
    setTime(time, camera) {
      foundation.setTime(time, camera);
      factory.setTime(time, camera);
    },
    dispose() {
      foundation.dispose();
      factory.dispose();
      disposeObject3D(root);
      root.removeFromParent();
    },
  };
}
