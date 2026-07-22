import * as THREE from "three";
import { disposeObject3D } from "../shared/dispose-object-3d.js";
import { FOUNDATION_PRESENTATION_SCALE } from "./layout-constants.js";
import { createFoundationWorld } from "./objects/foundation/index.js";
import { createFactoryWorld } from "./objects/factory/index.js";

// Center of the canonical 17 x 17 Rust-kernel footprint after the Foundation
// presentation transform has reached its expanded state. Keep this local so a
// live module reload cannot mix a new world module with stale layout exports.
const RUST_KERNEL_ASSEMBLY_PIVOT = new THREE.Vector3(-0.1, 0, -1.875);

export function createFilmWorld({
  showGrid = true,
  transparentBackground = false,
} = {}) {
  const scene = new THREE.Scene();
  scene.background = transparentBackground ? null : new THREE.Color(0x010407);

  const root = new THREE.Group();
  root.name = "factory-film-world";
  const kernelAssembly = new THREE.Group();
  kernelAssembly.name = "rust-kernel-assembly";
  kernelAssembly.position.copy(RUST_KERNEL_ASSEMBLY_PIVOT);
  const kernelAttachedContent = new THREE.Group();
  kernelAttachedContent.name = "rust-kernel-attached-content";
  kernelAttachedContent.position
    .copy(RUST_KERNEL_ASSEMBLY_PIVOT)
    .multiplyScalar(-1);
  kernelAssembly.add(kernelAttachedContent);
  root.add(kernelAssembly);
  if (showGrid) {
    const grid = new THREE.GridHelper(72, 72, 0x244c68, 0x102a3b);
    grid.position.y = 0;
    grid.material.transparent = true;
    grid.material.opacity = 0.28;
    kernelAttachedContent.add(grid);
  }
  const foundation = createFoundationWorld();
  const factory = createFactoryWorld({
    getPlayerWorldPosition: (target) => foundation.getPlayerWorldPosition(target),
  });
  // The native meshes use compact modeling units. This authored transform maps
  // the Foundation set back onto the original SVG composition while preserving
  // real depth for a future orbit camera.
  foundation.group.scale.setScalar(FOUNDATION_PRESENTATION_SCALE);
  foundation.group.position.set(-1.9, 0, 4.5);
  foundation.group.userData.presentationBaseX = foundation.group.position.x;
  foundation.group.userData.presentationBaseZ = foundation.group.position.z;
  const factoryOffset = factory.group.userData.recommendedWorldOffset;
  factory.group.position.set(factoryOffset.x, factoryOffset.y, factoryOffset.z);
  kernelAttachedContent.add(foundation.group, factory.group);
  scene.add(root);

  return {
    scene,
    setTime(time, camera) {
      foundation.setTime(time, camera);
      factory.setTime(time, camera);
    },
    setKernelRotationY(angle) {
      const nextAngle = Number(angle);
      kernelAssembly.rotation.y = Number.isFinite(nextAngle) ? nextAngle : 0;
      kernelAssembly.updateMatrixWorld(true);
    },
    dispose() {
      foundation.dispose();
      factory.dispose();
      disposeObject3D(root);
      root.removeFromParent();
    },
  };
}
