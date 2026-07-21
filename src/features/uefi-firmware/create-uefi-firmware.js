import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createInfoCard } from "../../objects/cards/index.js";
import { createCircuitTrace } from "../../objects/connections/circuit-trace/index.js";
import { createDataStream } from "../../objects/effects/data-stream/index.js";
import { createExpandingStageLayer } from "../../objects/layers/expanding-stage-layer/index.js";
import { UEFI_FIRMWARE_CONFIG } from "./config.js";

export function createUefiFirmware() {
  const group = new THREE.Group();
  group.name = "uefi-firmware";
  const source = new THREE.Vector3().fromArray(UEFI_FIRMWARE_CONFIG.source);
  const sourceLight = new THREE.PointLight(0x55d6ff, 0, 3.2, 2);
  sourceLight.position.copy(source).setY(source.y + 0.24);
  group.add(sourceLight);

  const stageLayer = createExpandingStageLayer({
    name: "uefi-boot-environment",
    title: "UEFI BOOT ENVIRONMENT",
    sourcePosition: UEFI_FIRMWARE_CONFIG.source,
    targetPosition: [0, UEFI_FIRMWARE_CONFIG.layerY, 0],
    sourceSize: UEFI_FIRMWARE_CONFIG.sourceSize,
    size: [
      UEFI_FIRMWARE_CONFIG.width,
      UEFI_FIRMWARE_CONFIG.height,
      UEFI_FIRMWARE_CONFIG.depth,
    ],
    color: 0x087ca8,
    emissive: 0x28cfff,
    emissiveIntensity: 0.22,
    metalness: 0.12,
    roughness: 0.22,
    surfaceOpacity: 0.28,
    depthWrite: false,
    edgeColor: 0x83e5ff,
    labelWidth: UEFI_FIRMWARE_CONFIG.width * 0.96,
    labelOptions: {
      panel: false,
      titleFont: "900 300px ui-monospace, SFMono-Regular, Consolas, monospace",
    },
  });
  group.add(stageLayer.group);

  const services = UEFI_FIRMWARE_CONFIG.services.map((definition) => {
    const service = createInfoCard({
      title: definition.title,
      description: "",
      width: definition.size[0],
      height: definition.size[1],
      depth: definition.size[2],
      color: 0x092033,
      edgeColor: 0x76ddff,
      labelPlacement: "front",
    });
    service.group.position.fromArray(definition.position);
    group.add(service.group);
    return { definition, service };
  });
  const usbService = UEFI_FIRMWARE_CONFIG.services.find(
    ({ id }) => id === "usb-boot-service",
  );
  const bootManager = UEFI_FIRMWARE_CONFIG.services.find(
    ({ id }) => id === "boot-manager",
  );
  const usbServicePath = createCircuitTrace({
    points: [
      new THREE.Vector3(3.55, -0.79, 1.55),
      new THREE.Vector3(3.42, -0.18, 1.42),
      new THREE.Vector3(2.92, 0.36, 1.16),
      new THREE.Vector3(...usbService.position),
    ],
    color: 0x79e3ff,
  });
  const bootEntryPackage = createDataStream({
    points: [
      new THREE.Vector3(...usbService.position),
      new THREE.Vector3(1.18, 0.66, 0.9),
      new THREE.Vector3(...bootManager.position),
    ],
    count: 1,
    blockSize: [0.42, 0.16, 0.26],
    trailLength: 0,
    color: 0xc8f5ff,
  });
  bootEntryPackage.group.name = "bootx64-efi-package";
  group.add(usbServicePath.group, bootEntryPackage.group);

  const setState = ({
    patternProgress = 0,
    layerProgress = 0,
    usbServiceProgress = 0,
    bootManagerProgress = 0,
    usbActivityProgress = 0,
    bootEntryProgress = 0,
    retreatProgress = 0,
    opacity = 1,
  } = {}) => {
    const pattern = smootherstep(patternProgress);
    const lift = intervalProgress(layerProgress, 0, 0.48);
    const expansion = intervalProgress(layerProgress, 0.48, 1);
    const layerVisibility = intervalProgress(layerProgress, 0, 0.16);
    const usbServiceIn = smootherstep(usbServiceProgress);
    const bootManagerIn = smootherstep(bootManagerProgress);
    const retreat = smootherstep(retreatProgress);
    const activeOpacity = (1 - retreat) * opacity;
    sourceLight.intensity = Math.sin(pattern * Math.PI) * activeOpacity * 2.2;
    const retreatOffsetX = -8 * retreat;
    stageLayer.setState({
      revealProgress: layerVisibility,
      liftProgress: lift,
      expansionProgress: expansion,
      labelProgress: intervalProgress(expansion, 0.18, 0.72),
      retreatProgress,
      opacity,
    });
    services.forEach(({ definition, service }) => {
      const progress = definition.id === "usb-boot-service"
        ? usbServiceIn
        : bootManagerIn;
      service.setState({
        progress,
        activationProgress: progress,
        opacity: activeOpacity,
      });
      service.group.position.set(
        definition.position[0] + retreatOffsetX,
        definition.position[1],
        definition.position[2],
      );
    });
    const usbActivity = smootherstep(usbActivityProgress);
    usbServicePath.setState({
      progress: usbActivity,
      opacity: activeOpacity * Math.sin(usbActivity * Math.PI) * 0.88,
      pulse: 1,
    });
    bootEntryPackage.setState({
      progress: bootEntryProgress,
      opacity: activeOpacity,
    });
  };
  setState();

  return {
    group,
    setState,
    dispose() {
      services.forEach(({ service }) => service.dispose());
      usbServicePath.dispose();
      bootEntryPackage.dispose();
      stageLayer.dispose();
      group.removeFromParent();
    },
  };
}
