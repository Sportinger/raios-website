import * as THREE from "three";
import { FACTORY_PALETTE } from "./config.js";
import { createVectorBox } from "./primitives.js";

export function createFactoryDoor(tracker, color, position = [0, 0, 0], scale = 1) {
  const group = new THREE.Group();
  group.name = "factory-door";
  group.position.set(...position);
  group.scale.setScalar(scale);
  const left = createVectorBox(tracker, {
    size: [0.22, 3.8, 0.42], color: FACTORY_PALETTE.panel,
    edgeColor: color, position: [-1.38, 1.9, 0],
  });
  const right = createVectorBox(tracker, {
    size: [0.22, 3.8, 0.42], color: FACTORY_PALETTE.panel,
    edgeColor: color, position: [1.38, 1.9, 0],
  });
  const lintel = createVectorBox(tracker, {
    size: [2.98, 0.24, 0.42], color: FACTORY_PALETTE.panel,
    edgeColor: color, position: [0, 3.72, 0],
  });
  const threshold = createVectorBox(tracker, {
    size: [2.98, 0.14, 0.7], color, position: [0, 0.07, 0],
  });
  const hinge = new THREE.Group();
  hinge.position.set(-1.22, 0, 0.04);
  const leaf = createVectorBox(tracker, {
    size: [2.42, 3.35, 0.2], color: FACTORY_PALETTE.panelLight,
    edgeColor: color, position: [1.21, 1.77, 0],
  });
  hinge.add(leaf);
  group.add(left, right, lintel, threshold, hinge);
  return { group, hinge, leaf };
}
