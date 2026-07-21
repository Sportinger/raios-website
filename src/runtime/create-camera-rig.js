import * as THREE from "three";
import { smootherstep } from "../animation/progress.js";
import { CAMERA_HOME } from "./camera-config.js";

export function createCameraRig(camera) {
  const homePosition = new THREE.Vector3().fromArray(CAMERA_HOME.position);
  const homeTarget = new THREE.Vector3().fromArray(CAMERA_HOME.target);
  const position = new THREE.Vector3();
  const target = new THREE.Vector3();

  const setPose = (nextPosition, nextTarget) => {
    camera.position.copy(nextPosition);
    camera.lookAt(nextTarget);
  };

  return {
    reset() {
      setPose(homePosition, homeTarget);
    },

    transitionFrom(startPosition, startTarget, progress) {
      const easedProgress = smootherstep(progress);
      position.lerpVectors(startPosition, homePosition, easedProgress);
      target.lerpVectors(startTarget, homeTarget, easedProgress);
      setPose(position, target);
    },
  };
}
