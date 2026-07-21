import { createBootSequence, BOOT_SCENES } from "../../features/boot-sequence/index.js";
import { createBootCameraChoreography } from "./create-camera-choreography.js";
import { SYSTEM_STACK_OFFSET_Y } from "../shared/system-stack-layout.js";

const BOOT_SCENE_WEIGHT = 0.95;
export const BOOT_SEQUENCE_WEIGHT = BOOT_SCENES.length * BOOT_SCENE_WEIGHT;

export function createBootSequenceChapter({ cameraRig, lightRig }) {
  const sequence = createBootSequence();
  sequence.group.position.y = SYSTEM_STACK_OFFSET_Y;
  const cameraChoreography = createBootCameraChoreography(cameraRig);
  const sceneLength = 1 / BOOT_SCENES.length;
  const navigationSections = BOOT_SCENES.map((scene, index) => Object.freeze({
    ...scene,
    start: index * sceneLength,
    end: (index + 1) * sceneLength,
  }));

  return {
    id: "boot-sequence",
    group: sequence.group,
    navigationSections,

    prepareRender(renderer, scene, camera) {
      sequence.prepareRender(renderer, scene, camera);
    },

    setUefiGlassOptics(settings) {
      sequence.setUefiGlassOptics(settings);
    },

    update(progress, animationTime = 0) {
      lightRig.setIntensity(1);
      const scaledProgress = Math.min(
        BOOT_SCENES.length - 0.000001,
        progress * BOOT_SCENES.length,
      );
      const sceneIndex = Math.floor(scaledProgress);
      const sceneProgress = scaledProgress - sceneIndex;
      sequence.setSceneProgress(sceneIndex, sceneProgress, animationTime);
      cameraChoreography.update(progress);
    },

    resize() {},
    dispose: () => sequence.dispose(),
  };
}
