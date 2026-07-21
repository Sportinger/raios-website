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
    createOrbit({ center, startPosition, angle, axis = new THREE.Vector3(0, 1, 0) }) {
      const offset = startPosition.clone().sub(center);
      const endPosition = offset.clone().applyAxisAngle(axis, angle).add(center);

      return {
        endPosition,

        update(progress) {
          position.copy(offset)
            .applyAxisAngle(axis, angle * smootherstep(progress))
            .add(center);
          setPose(position, center);
        },
      };
    },

    createHomeboundPath({ positions, targets, easing = smootherstep }) {
      const positionCurve = new THREE.CatmullRomCurve3(
        [...positions, homePosition.clone()],
        false,
        "centripetal",
      );
      const targetCurve = new THREE.CatmullRomCurve3(
        [...targets, homeTarget.clone()],
        false,
        "centripetal",
      );

      return {
        update(progress) {
          const easedProgress = easing(progress);
          positionCurve.getPointAt(easedProgress, position);
          targetCurve.getPointAt(easedProgress, target);
          setPose(position, target);
        },
      };
    },

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
