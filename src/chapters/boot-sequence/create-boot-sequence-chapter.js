import { createBootSequence, BOOT_SCENES } from "../../features/boot-sequence/index.js";

export function createBootSequenceChapter({ cameraRig, lightRig }) {
  const sequence = createBootSequence();
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

    update(progress) {
      cameraRig.reset();
      lightRig.setIntensity(1);
      const scaledProgress = Math.min(
        BOOT_SCENES.length - 0.000001,
        progress * BOOT_SCENES.length,
      );
      const sceneIndex = Math.floor(scaledProgress);
      sequence.setSceneProgress(sceneIndex, scaledProgress - sceneIndex);
    },

    resize() {},
    dispose: () => sequence.dispose(),
  };
}
