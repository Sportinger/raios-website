import * as THREE from "three";
import { intervalProgress } from "../../animation/progress.js";
import { createBootUsb } from "../boot-usb/index.js";
import { createHardwarePlatform } from "../hardware-platform/index.js";
import { createKernelPlatform } from "../kernel-platform/index.js";
import { createLimineStage } from "../limine-stage/index.js";
import { createUefiFirmware } from "../uefi-firmware/index.js";
import { BOOT_PHASES } from "./config.js";
import { BOOT_TIMELINE } from "./timeline.js";

const BOOT_PHASE_NAMES = Object.freeze(Object.keys(BOOT_PHASES));

function createPhaseState(sceneIndex, progress) {
  return Object.fromEntries(
    BOOT_PHASE_NAMES.map((phase, index) => [
      phase,
      index < sceneIndex ? 1 : index === sceneIndex ? progress : 0,
    ]),
  );
}

export function createBootSequence() {
  const group = new THREE.Group();
  group.name = "boot-sequence";
  const hardware = createHardwarePlatform();
  const uefi = createUefiFirmware({
    sourceAnchor: hardware.anchors.spiFlash,
  });
  const usb = createBootUsb();
  const limine = createLimineStage({
    sourceAnchor: uefi.anchors.bootManager,
  });
  const kernel = createKernelPlatform({
    sourceAnchor: limine.anchors.kernelLoader,
  });
  group.add(
    hardware.group,
    uefi.group,
    usb.group,
    limine.group,
    kernel.group,
  );

  const setSceneProgress = (sceneIndex, progress, animationTime = 0) => {
    const {
      firmware,
      bootUsb,
      limineLoad,
      kernelLoad,
      controlHandoff,
      kernelLanding,
    } = createPhaseState(sceneIndex, progress);
    const timing = BOOT_TIMELINE;
    hardware.setState({
      initializationProgress: firmware,
      usbProgress: bootUsb,
      firmwareRetiredProgress: intervalProgress(
        controlHandoff,
        ...timing.hardware.firmwareRetired,
      ),
    });
    uefi.setState({
      patternProgress: intervalProgress(firmware, ...timing.uefi.pattern),
      layerProgress: intervalProgress(firmware, ...timing.uefi.layer),
      usbServiceProgress: intervalProgress(firmware, ...timing.uefi.usbService),
      bootManagerProgress: intervalProgress(bootUsb, ...timing.uefi.bootManager),
      usbPathProgress: intervalProgress(bootUsb, ...timing.uefi.usbPath),
      bootManagerPathProgress: intervalProgress(
        bootUsb,
        ...timing.uefi.bootManagerPath,
      ),
      flowPhase: animationTime * 0.42,
      cableRetreatProgress: intervalProgress(
        controlHandoff,
        ...timing.uefi.cableRetreat,
      ),
      retreatProgress: intervalProgress(controlHandoff, ...timing.uefi.retreat),
    });
    usb.setState({
      insertProgress: intervalProgress(bootUsb, ...timing.usb.insert),
      searchProgress: intervalProgress(bootUsb, ...timing.usb.search),
      dimProgress: kernelLanding,
    });
    limine.setState({
      layerProgress: intervalProgress(limineLoad, ...timing.limine.layer),
      configProgress: intervalProgress(limineLoad, ...timing.limine.config),
      kernelLoaderProgress: intervalProgress(
        kernelLoad,
        ...timing.limine.kernelLoader,
      ),
      handoffProgress: intervalProgress(controlHandoff, ...timing.limine.handoff),
      retreatProgress: intervalProgress(controlHandoff, ...timing.limine.retreat),
    });
    kernel.setState({
      assemblyProgress: intervalProgress(kernelLoad, ...timing.kernel.assembly),
      landingProgress: intervalProgress(
        controlHandoff + kernelLanding,
        ...timing.kernel.landingAcrossHandoff,
      ),
      runningProgress: Math.max(
        intervalProgress(controlHandoff, ...timing.kernel.handoffRunning),
        intervalProgress(kernelLanding, ...timing.kernel.landedRunning),
      ),
    });
  };
  setSceneProgress(0, 0);

  return {
    group,
    prepareRender(renderer, scene, camera) {
      uefi.prepareRender(renderer, scene, camera);
      limine.prepareRender(renderer, scene, camera);
      kernel.prepareRender(renderer, scene, camera);
    },
    setUefiGlassOptics(settings) {
      uefi.setGlassOptics(settings);
    },
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
