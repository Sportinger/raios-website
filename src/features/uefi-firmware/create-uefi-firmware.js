import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createInfoCard } from "../../objects/cards/index.js";
import { createCable } from "../../objects/connections/cable/index.js";
import { createDataStream } from "../../objects/effects/data-stream/index.js";
import { createEnergyFlow } from "../../objects/effects/energy-flow/index.js";
import { createPlasmaPulse } from "../../objects/effects/plasma-pulse/index.js";
import { createExpandingStageLayer } from "../../objects/layers/expanding-stage-layer/index.js";
import { UEFI_FIRMWARE_CONFIG } from "./config.js";
import { createUsbServiceRoute } from "./create-usb-service-route.js";

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
  const usbServiceCable = createCable({
    points: createUsbServiceRoute(),
    config: {
      radius: 0.042,
      tubularSegments: 96,
      radialSegments: 10,
      signalFade: 0.09,
      idleColor: 0x263d4b,
      poweredColor: 0x58d7ff,
      poweredEmissiveStrength: 1.05,
      idleMetalness: 0.68,
      idleRoughness: 0.26,
    },
  });
  usbServiceCable.group.name = "usb-service-cable";
  const usbSignalFlow = createEnergyFlow({
    curve: usbServiceCable.curve,
    config: {
      count: 11,
      cableRadius: 0.042,
      ringOffset: 0.003,
      ringThickness: 0.008,
      color: 0xb8f2ff,
      opacity: 0.72,
    },
  });
  const usbCableHead = createPlasmaPulse({
    curve: usbServiceCable.curve,
    accentColor: 0x58d7ff,
    config: {
      scale: 0.13,
      fadeOutLength: 0.1,
      lightIntensity: 1.4,
      lightDistance: 1.15,
      turbulenceAmount: 0.05,
    },
  });
  usbCableHead.group.name = "usb-cable-writing-light";
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
  group.add(
    usbServiceCable.group,
    usbSignalFlow.group,
    usbCableHead.group,
    bootEntryPackage.group,
  );

  const setState = ({
    patternProgress = 0,
    layerProgress = 0,
    opacityBoostProgress = 0,
    usbServiceProgress = 0,
    bootManagerProgress = 0,
    usbPathProgress = 0,
    usbPathRetractionProgress = 0,
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
      surfaceOpacityScale: THREE.MathUtils.lerp(
        1,
        2,
        smootherstep(opacityBoostProgress),
      ),
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
    const usbPath = smootherstep(usbPathProgress);
    const usbPathRetraction = smootherstep(usbPathRetractionProgress);
    usbServiceCable.setState({
      revealProgress: usbPath,
      energizedProgress: usbPath,
      retractProgress: usbPathRetraction,
      opacity: activeOpacity,
    });
    usbSignalFlow.setState({
      energizedProgress: usbPath,
      retractProgress: usbPathRetraction,
      phase: usbPath * 1.15,
      opacity: activeOpacity,
    });
    usbCableHead.setState({
      progress: usbPath,
      active: usbPathProgress > 0.001 && usbPathRetractionProgress < 0.001,
      opacity: activeOpacity,
      occludeCore: true,
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
      usbServiceCable.dispose();
      usbSignalFlow.dispose();
      usbCableHead.dispose();
      bootEntryPackage.dispose();
      stageLayer.dispose();
      group.removeFromParent();
    },
  };
}
