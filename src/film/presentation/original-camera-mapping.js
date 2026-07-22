import * as THREE from "three";
import { FILM_CAMERA_KEYFRAMES } from "../film-data.js";

export const ORIGINAL_CAMERA_CONSTANTS = Object.freeze({
  referenceWidth: 1200,
  referenceHeight: 680,
  viewBox: Object.freeze({ x: 0, y: -220, width: 1200, height: 1120 }),
  wideFactor: 0.92,
  wideDistancePerAspect: 0.7,
  wideMaxDistanceOffset: 1.25,
  verticalBias: 110,
  wideVerticalBiasPerAspect: 260,
  wideMaxVerticalBias: 320,
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smoothstep = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

export function originalCameraKeyframeAt(time, keyframes = FILM_CAMERA_KEYFRAMES) {
  let before = keyframes[0];
  let after = keyframes[keyframes.length - 1];
  for (let index = 1; index < keyframes.length; index += 1) {
    if (time <= keyframes[index].at) {
      before = keyframes[index - 1];
      after = keyframes[index];
      break;
    }
  }
  const duration = Math.max(0.000001, after.at - before.at);
  const mix = smoothstep((time - before.at) / duration);
  return Object.freeze({
    scale: THREE.MathUtils.lerp(before.scale, after.scale, mix),
    focusX: THREE.MathUtils.lerp(before.focusX, after.focusX, mix),
    focusY: THREE.MathUtils.lerp(before.focusY, after.focusY, mix),
  });
}

export function originalSvgCameraAt(time, viewportWidth, viewportHeight) {
  const constants = ORIGINAL_CAMERA_CONSTANTS;
  const frame = originalCameraKeyframeAt(time);
  const viewportAspect = Math.max(1, viewportWidth) / Math.max(1, viewportHeight);
  const referenceAspect = constants.referenceWidth / constants.referenceHeight;
  const aspectExcess = Math.max(0, viewportAspect - referenceAspect);
  const distanceOffset = clamp(
    aspectExcess * constants.wideDistancePerAspect,
    0,
    constants.wideMaxDistanceOffset,
  );
  const responsiveVerticalBias = clamp(
    aspectExcess * constants.wideVerticalBiasPerAspect,
    0,
    constants.wideMaxVerticalBias,
  );
  const cameraScale = constants.wideFactor / (1 / Math.max(0.001, frame.scale) + distanceOffset);
  const focusPxX = constants.referenceWidth * frame.focusX;
  const focusPxY = constants.referenceHeight * frame.focusY
    + constants.verticalBias
    + responsiveVerticalBias;
  const centerX = constants.viewBox.x + constants.viewBox.width / 2;
  const centerY = constants.viewBox.y + constants.viewBox.height / 2;
  return Object.freeze({
    ...frame,
    cameraScale,
    distanceOffset,
    responsiveVerticalBias,
    focusPxX,
    focusPxY,
    translateX: centerX - focusPxX * cameraScale,
    translateY: centerY - focusPxY * cameraScale,
  });
}

export function createOriginalThreeCameraMapper(camera, {
  baseTarget = new THREE.Vector3(0, 1.6, 0),
  cameraDirection = new THREE.Vector3(1, 0.8164965809, 1).normalize(),
  cameraDistance = 44,
  worldWidth = 31,
  worldHeight = 20,
} = {}) {
  const target = baseTarget.clone();
  const direction = cameraDirection.clone().normalize();
  const viewDirection = direction.clone().negate();
  const screenRight = new THREE.Vector3().crossVectors(viewDirection, camera.up).normalize();
  const screenUp = new THREE.Vector3().crossVectors(screenRight, viewDirection).normalize();

  const setTime = (time, viewportWidth, viewportHeight) => {
    const state = originalSvgCameraAt(time, viewportWidth, viewportHeight);
    const wideBiasWorld = state.responsiveVerticalBias
      * (worldHeight / ORIGINAL_CAMERA_CONSTANTS.referenceHeight);
    target.copy(baseTarget)
      .addScaledVector(screenRight, (state.focusX - 0.5) * worldWidth)
      .addScaledVector(screenUp, (0.5 - state.focusY) * worldHeight - wideBiasWorld);
    camera.position.copy(target).addScaledVector(direction, cameraDistance);
    camera.zoom = state.cameraScale;
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    return state;
  };

  return Object.freeze({ target, setTime });
}
