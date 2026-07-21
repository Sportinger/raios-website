import * as THREE from "three";
import { smootherstep } from "../animation/progress.js";

export function createCameraRig(camera) {
  const defaultUp = camera.up?.clone() ?? new THREE.Vector3(0, 1, 0);
  const position = new THREE.Vector3();
  const target = new THREE.Vector3();
  const up = new THREE.Vector3();

  const setPose = (nextPosition, nextTarget, nextUp = homeUp) => {
    camera.position.copy(nextPosition);
    camera.up.copy(nextUp).normalize();
    camera.lookAt(nextTarget);
  };

  return {
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
