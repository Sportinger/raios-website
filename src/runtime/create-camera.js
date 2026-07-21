import * as THREE from "three";

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(7.8, 6.4, 9.2);
  camera.lookAt(0, -0.25, 0);
  return camera;
}
