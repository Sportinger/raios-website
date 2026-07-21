import * as THREE from "three";
import { intervalProgress } from "../../animation/progress.js";
import { createBootInformation } from "../boot-information/index.js";
import { createBootUsb } from "../boot-usb/index.js";
import { createControlHandoff } from "../control-handoff/index.js";
import { createHardwarePlatform } from "../hardware-platform/index.js";
import { createKernelPlatform } from "../kernel-platform/index.js";
import { createLimineBridge } from "../limine-bridge/index.js";
import { createUefiFirmware } from "../uefi-firmware/index.js";
import { BOOT_SCENES } from "./config.js";

export function createBootSequence() {
  const group = new THREE.Group();
  group.name = "boot-sequence";
  const hardware = createHardwarePlatform();
  const uefi = createUefiFirmware();
  const usb = createBootUsb();
  const limine = createLimineBridge();
  const kernel = createKernelPlatform();
  const bootInformation = createBootInformation();
  const handoff = createControlHandoff();
  group.add(
    hardware.group,
    uefi.group,
    usb.group,
    limine.group,
    kernel.group,
    bootInformation.group,
    handoff.group,
  );

  const setSceneProgress = (sceneIndex, progress) => {
    const phase = BOOT_SCENES.map((_, index) => {
      if (index < sceneIndex) return 1;
      if (index === sceneIndex) return progress;
      return 0;
    });
    const [bareMetal, firmware, bootUsb, limineLoad, kernelLoad,
      startInformation, controlHandoff, kernelLanding] = phase;
    const limineSearch = limineLoad < 1
      ? intervalProgress(limineLoad, 0.68, 1) * 0.45
      : 0.45 + kernelLoad * 0.55;

    hardware.setState({
      hardwareProgress: bareMetal,
      initializationProgress: firmware,
      usbProgress: bootUsb,
      opacity: 1,
    });
    uefi.setState({
      patternProgress: intervalProgress(firmware, 0, 0.62),
      layerProgress: intervalProgress(firmware, 0.28, 1),
      retreatProgress: intervalProgress(controlHandoff, 0.56, 1),
      opacity: 1,
    });
    usb.setState({
      insertProgress: intervalProgress(bootUsb, 0, 0.48),
      searchProgress: intervalProgress(bootUsb, 0.42, 0.76),
      partitionProgress: intervalProgress(bootUsb, 0.62, 0.86),
      fileProgress: intervalProgress(bootUsb, 0.82, 1),
      dimProgress: kernelLanding,
      opacity: 1,
    });
    limine.setState({
      loadProgress: intervalProgress(limineLoad, 0, 0.58),
      bridgeProgress: intervalProgress(limineLoad, 0.32, 0.76),
      searchProgress: limineSearch,
      configurationProgress: intervalProgress(kernelLoad, 0, 0.42),
      packageProgress: intervalProgress(kernelLoad, 0.24, 0.52),
      retreatProgress: intervalProgress(controlHandoff, 0.56, 1),
      opacity: 1,
    });
    kernel.setState({
      transferProgress: intervalProgress(kernelLoad, 0.38, 0.88),
      assemblyProgress: intervalProgress(kernelLoad, 0.46, 1),
      landingProgress: intervalProgress(kernelLanding, 0.12, 0.82),
      runningProgress: intervalProgress(kernelLanding, 0.72, 1),
      opacity: 1,
    });
    bootInformation.setState({
      prepareProgress: intervalProgress(startInformation, 0, 0.58),
      dockProgress: intervalProgress(startInformation, 0.36, 0.92),
      consumeProgress: intervalProgress(controlHandoff, 0.46, 0.78),
      opacity: 1,
    });
    handoff.setState({
      openProgress: intervalProgress(controlHandoff, 0, 0.34),
      impulseProgress: intervalProgress(controlHandoff, 0.28, 0.72),
      closeProgress: intervalProgress(controlHandoff, 0.72, 1),
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
      bootInformation.dispose();
      handoff.dispose();
      group.removeFromParent();
    },
  };
}
