import * as THREE from "three";
import { smootherstep } from "../animation/progress.js";
import { CAMERA_HOME } from "./camera-config.js";

export function createCameraRig(camera) {
  const homePosition = new THREE.Vector3().fromArray(CAMERA_HOME.position);
  const homeTarget = new THREE.Vector3().fromArray(CAMERA_HOME.target);
  const homeUp = camera.up?.clone() ?? new THREE.Vector3(0, 1, 0);
  const position = new THREE.Vector3();
  const target = new THREE.Vector3();
  const up = new THREE.Vector3();

  const setPose = (nextPosition, nextTarget, nextUp = homeUp) => {
    camera.position.copy(nextPosition);
    camera.up.copy(nextUp).normalize();
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
          setPose(position, targetOverride ?? center, homeUp);
        },
      };
    },

    createHomeboundPath({
      positions,
      targets,
      easing = smootherstep,
      endPosition = homePosition,
      endTarget = homeTarget,
      endUp = homeUp,
      ups = null,
    }) {
      const pathUps = ups ?? positions.map(() => homeUp.clone());
      if (positions.length !== targets.length || positions.length !== pathUps.length) {
        throw new Error("Camera path positions, targets, and up vectors must match");
      }
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
      const upCurve = new THREE.CatmullRomCurve3(
        [...pathUps, endUp.clone()],
        false,
        "centripetal",
      );

      return {
        update(progress, targetOverride = null, targetOverrideWeight = 1) {
          const easedProgress = easing(progress);
          positionCurve.getPointAt(easedProgress, position);
          targetCurve.getPointAt(easedProgress, target);
          upCurve.getPointAt(easedProgress, up).normalize();
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

    createHomeboundPoseTrack({
      positions,
      targets,
      easing = smootherstep,
      startPosition = homePosition,
      startTarget = homeTarget,
      startUp = homeUp,
      ups = null,
    }) {
      const poseUps = ups ?? positions.map(() => homeUp.clone());
      if (positions.length !== targets.length || positions.length !== poseUps.length) {
        throw new Error("Camera pose positions, targets, and up vectors must match");
      }
      const trackPositions = [startPosition, ...positions, homePosition];
      const trackTargets = [startTarget, ...targets, homeTarget];
      const trackUps = [startUp, ...poseUps, homeUp];

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
          up.lerpVectors(trackUps[index], trackUps[index + 1], easedProgress).normalize();
          setPose(position, target, up);
        },
      };
    },

    createPoseTransition({
      startPosition,
      startTarget,
      endPosition,
      endTarget,
      startUp = homeUp,
      endUp = homeUp,
      easing = smootherstep,
    }) {
      return {
        update(progress) {
          const easedProgress = easing(progress);
          position.lerpVectors(startPosition, endPosition, easedProgress);
          target.lerpVectors(startTarget, endTarget, easedProgress);
          up.lerpVectors(startUp, endUp, easedProgress).normalize();
          setPose(position, target, up);
        },
      };
    },

    reset() {
      setPose(homePosition, homeTarget, homeUp);
    },

    transitionFrom(startPosition, startTarget, progress) {
      const easedProgress = smootherstep(progress);
      position.lerpVectors(startPosition, homePosition, easedProgress);
      target.lerpVectors(startTarget, homeTarget, easedProgress);
      setPose(position, target, homeUp);
    },
  };
}
