import * as THREE from "three";
import { intervalProgress } from "../../animation/progress.js";
import { createBootUsb } from "../../features/boot-usb/index.js";
import { createHardwarePlatform } from "../../features/hardware-platform/index.js";
import { createRustKernel } from "../../features/rust-kernel/index.js";
import { SYSTEM_STACK_OFFSET_Y } from "../shared/system-stack-layout.js";

export function createKernelChapter({ cameraRig, lightRig }) {
  const group = new THREE.Group();
  group.name = "kernel-breakdown-scene";
  group.position.y = SYSTEM_STACK_OFFSET_Y;
  const hardware = createHardwarePlatform();
  const usb = createBootUsb();
  const kernel = createRustKernel();
  group.add(hardware.group, usb.group, kernel.group);

  return {
    id: "kernel",
    group,

    update(progress) {
      cameraRig.reset();
      lightRig.setIntensity(1);
      hardware.setState({
        hardwareProgress: 1,
        initializationProgress: 1,
        usbProgress: 1,
        firmwareRetiredProgress: 1,
        opacity: 1,
      });
      usb.setState({
        insertProgress: 1,
        searchProgress: 1,
        partitionProgress: 1,
        fileProgress: 1,
        dimProgress: 1,
        opacity: 1,
      });
      kernel.setAssemblyProgress(1);
      kernel.setBreakdownProgress(intervalProgress(progress, 0.08, 1));
    },

    resize() {},
    dispose() {
      hardware.dispose();
      usb.dispose();
      kernel.dispose();
      group.removeFromParent();
    },
  };
}
