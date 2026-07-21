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
      const getPositionAt = (progress, targetPosition) => (
        targetPosition.copy(offset)
          .applyAxisAngle(axis, angle * smootherstep(progress))
          .add(center)
      );

      return {
        endPosition,

        update(progress, targetOverride = null) {
          getPositionAt(progress, position);
          setPose(position, targetOverride ?? center);
        },
      };
    },

    createHomeboundPath({
      positions,
      targets,
      easing = smootherstep,
      endPosition = homePosition,
      endTarget = homeTarget,
    }) {
      const positionCurve = new THREE.CatmullRomCurve3(
        [...positions, endPosition.clone()],
        false,
        "centripetal",
      );
      const targetCurve = new THREE.CatmullRomCurve3(
        [...targets, endTarget.clone()],
        false,
        "centripetal",
      );

      return {
        update(progress, targetOverride = null, targetOverrideWeight = 1) {
          const easedProgress = easing(progress);
          positionCurve.getPointAt(easedProgress, position);
          targetCurve.getPointAt(easedProgress, target);
          if (targetOverride) {
            target.lerp(
              targetOverride,
              THREE.MathUtils.clamp(targetOverrideWeight, 0, 1),
            );
          }
          setPose(position, target);
        },
      };
    },

    createHomeboundPoseTrack({
      positions,
      targets,
      easing = smootherstep,
      startPosition = homePosition,
      startTarget = homeTarget,
    }) {
      if (positions.length !== targets.length) {
        throw new Error("Camera pose positions and targets must have equal length");
      }
      const trackPositions = [startPosition, ...positions, homePosition];
      const trackTargets = [startTarget, ...targets, homeTarget];

      return {
        segmentCount: trackPositions.length - 1,

        update(segmentIndex, progress) {
          const index = THREE.MathUtils.clamp(
            Math.floor(segmentIndex),
            0,
            trackPositions.length - 2,
          );
          const easedProgress = easing(progress);
          position.lerpVectors(
            trackPositions[index],
            trackPositions[index + 1],
            easedProgress,
          );
          target.lerpVectors(
            trackTargets[index],
            trackTargets[index + 1],
            easedProgress,
          );
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
