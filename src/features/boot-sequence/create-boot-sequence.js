import * as THREE from "three";
import { intervalProgress } from "../../animation/progress.js";
import { createBootUsb } from "../boot-usb/index.js";
import { createHardwarePlatform } from "../hardware-platform/index.js";
import { createKernelPlatform } from "../kernel-platform/index.js";
import { createLimineStage } from "../limine-stage/index.js";
import { createUefiFirmware } from "../uefi-firmware/index.js";
import { BOOT_SCENES } from "./config.js";

export function createBootSequence() {
  const group = new THREE.Group();
  group.name = "boot-sequence";
  const hardware = createHardwarePlatform();
  const uefi = createUefiFirmware();
  const usb = createBootUsb();
  const limine = createLimineStage();
  const kernel = createKernelPlatform();
  group.add(
    hardware.group,
    uefi.group,
    usb.group,
    limine.group,
    kernel.group,
  );

  const setSceneProgress = (sceneIndex, progress, animationTime = 0) => {
    const phase = BOOT_SCENES.map((_, index) => {
      if (index < sceneIndex) return 1;
      if (index === sceneIndex) return progress;
      return 0;
    });
    const [firmware, bootUsb, limineLoad, kernelLoad,
      startInformation, controlHandoff, kernelLanding] = phase;
    const uefiOpacityBoost = firmware < 1
      ? intervalProgress(firmware, 0.78, 1) * 0.3
      : 0.3 + intervalProgress(bootUsb, 0, 0.5) * 0.7;
    hardware.setState({
      hardwareProgress: 1,
      initializationProgress: firmware,
      usbProgress: bootUsb,
      firmwareRetiredProgress: intervalProgress(controlHandoff, 0.72, 1),
      opacity: 1,
    });
    uefi.setState({
      patternProgress: intervalProgress(firmware, 0, 0.62),
      layerProgress: intervalProgress(firmware, 0, 0.78),
      opacityBoostProgress: uefiOpacityBoost,
      usbServiceProgress: intervalProgress(firmware, 0.72, 1),
      bootManagerProgress: intervalProgress(bootUsb, 0.58, 0.76),
      usbPathProgress: intervalProgress(bootUsb, 0.32, 0.66),
      bootManagerPathProgress: intervalProgress(bootUsb, 0.58, 0.88),
      flowPhase: animationTime * 0.42,
      cableRetreatProgress: intervalProgress(controlHandoff, 0.52, 0.66),
      retreatProgress: intervalProgress(controlHandoff, 0.76, 1),
      opacity: 1,
    });
    usb.setState({
      insertProgress: intervalProgress(bootUsb, 0, 0.42),
      searchProgress: intervalProgress(bootUsb, 0.32, 0.66),
      partitionProgress: intervalProgress(bootUsb, 0.62, 0.86),
      fileProgress: intervalProgress(bootUsb, 0.82, 1),
      dimProgress: kernelLanding,
      opacity: 1,
    });
    limine.setState({
      layerProgress: intervalProgress(limineLoad, 0, 0.72),
      configProgress: intervalProgress(limineLoad, 0.72, 1),
      kernelLoaderProgress: intervalProgress(kernelLoad, 0, 0.28),
      handoffPrepareProgress: startInformation,
      handoffProgress: intervalProgress(controlHandoff, 0.28, 0.72),
      retreatProgress: intervalProgress(controlHandoff, 0.66, 0.88),
      opacity: 1,
    });
    kernel.setState({
      transferProgress: intervalProgress(kernelLoad, 0.32, 0.72),
      assemblyProgress: intervalProgress(kernelLoad, 0.46, 1),
      readyProgress: intervalProgress(startInformation, 0.7, 1),
      handoffProgress: intervalProgress(controlHandoff, 0.28, 0.72),
      landingProgress: intervalProgress(kernelLanding, 0.12, 0.82),
      runningProgress: Math.max(
        intervalProgress(controlHandoff, 0.28, 0.72),
        intervalProgress(kernelLanding, 0.72, 1),
      ),
      opacity: 1,
    });
  };
  setSceneProgress(0, 0);

  return {
    group,
    setSceneProgress,
    dispose() {
      hardware.dispose();
      uefi.dispose();
      usb.dispose();
      limine.dispose();
      kernel.dispose();
      group.removeFromParent();
    },
  };
}
