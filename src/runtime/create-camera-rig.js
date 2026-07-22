import * as THREE from "three";
import { smootherstep } from "../animation/progress.js";

export function createCameraRig(camera) {
  const defaultUp = camera.up?.clone() ?? new THREE.Vector3(0, 1, 0);
  const position = new THREE.Vector3();
  const target = new THREE.Vector3();
  const up = new THREE.Vector3();
  const currentPosition = camera.position.clone();
  const currentTarget = new THREE.Vector3();
  const currentUp = defaultUp.clone();

  const setPose = (nextPosition, nextTarget, nextUp = defaultUp) => {
    currentPosition.copy(nextPosition);
    currentTarget.copy(nextTarget);
    currentUp.copy(nextUp).normalize();
    camera.position.copy(nextPosition);
    camera.up.copy(currentUp);
    camera.lookAt(nextTarget);
  };

  return {
    getPose() {
      return {
        fov: camera.fov,
        position: currentPosition.toArray(),
        target: currentTarget.toArray(),
        up: currentUp.toArray(),
      };
    },

    createOrbit({
      center,
      startPosition,
      angle,
      axis = new THREE.Vector3(0, 1, 0),
      easing = smootherstep,
    }) {
      const offset = startPosition.clone().sub(center);
      const endPosition = offset.clone().applyAxisAngle(axis, angle).add(center);
      const getPositionAt = (progress, targetPosition) => (
        targetPosition.copy(offset)
          .applyAxisAngle(axis, angle * easing(progress))
          .add(center)
      );

      return {
        endPosition,

        update(progress, targetOverride = null) {
          getPositionAt(progress, position);
          setPose(position, targetOverride ?? center, defaultUp);
        },
      };
    },

    createPoseTransition({
      startPosition,
      startTarget,
      endPosition,
      endTarget,
      startUp = defaultUp,
      endUp = defaultUp,
      easing = smootherstep,
    }) {
      return {
        update(progress, targetOverride = null, targetOverrideWeight = 0) {
          const easedProgress = easing(progress);
          position.lerpVectors(startPosition, endPosition, easedProgress);
          target.lerpVectors(startTarget, endTarget, easedProgress);
          up.lerpVectors(startUp, endUp, easedProgress).normalize();
          if (targetOverride) {
            target.lerp(
              targetOverride,
              THREE.MathUtils.clamp(targetOverrideWeight, 0, 1),
            );
          }
          setPose(position, target, up);
        },
      };
    },

  };
}
