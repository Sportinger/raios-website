import { intervalProgress } from "../../animation/progress.js";
import { createRustKernel } from "../../features/rust-kernel/index.js";

export function createKernelChapter({ cameraRig, lightRig }) {
  const kernel = createRustKernel();

  return {
    id: "kernel",
    group: kernel.group,

    update(progress) {
      cameraRig.reset();
      lightRig.setIntensity(1);
      kernel.setAssemblyProgress(intervalProgress(progress, 0, 0.24));
      kernel.setBreakdownProgress(intervalProgress(progress, 0.24, 1));
    },

    resize() {},
    dispose: () => kernel.dispose(),
  };
}
