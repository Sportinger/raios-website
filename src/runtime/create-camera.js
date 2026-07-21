import * as THREE from "three";
import { CAMERA_HOME } from "./camera-config.js";

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.fromArray(CAMERA_HOME.position);
  camera.lookAt(...CAMERA_HOME.target);
  return camera;
}
