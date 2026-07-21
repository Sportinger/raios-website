import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createInfoCard } from "../../objects/cards/index.js";
import { createTransientSignalCable } from "../../objects/connections/transient-signal-cable/index.js";
import { createLayerAnchor } from "../../objects/layers/create-layer-anchor.js";
import { createExpandingStageLayer } from "../../objects/layers/expanding-stage-layer/index.js";
import { monospaceFont } from "../../objects/labels/typography.js";
import { UEFI_FIRMWARE_CONFIG } from "./config.js";
import {
  createBootManagerRoute,
  createUsbServiceRoute,
} from "./create-usb-service-route.js";

export function createUefiFirmware({ sourceAnchor }) {
  const group = new THREE.Group();
  group.name = "uefi-firmware";

  const stageLayer = createExpandingStageLayer({
    name: "uefi-boot-environment",
    title: "UEFI BOOT ENVIRONMENT",
    sourcePosition: sourceAnchor.position,
    targetPosition: [0, UEFI_FIRMWARE_CONFIG.layerY, 0],
    sourceSize: sourceAnchor.size,
    size: [
      UEFI_FIRMWARE_CONFIG.width,
      UEFI_FIRMWARE_CONFIG.height,
      UEFI_FIRMWARE_CONFIG.depth,
    ],
    color: UEFI_FIRMWARE_CONFIG.glassColor,
    emissive: 0x000000,
    emissiveIntensity: 0,
    envMapIntensity: 0.32,
    metalness: 0,
    roughness: 0.015,
    transmission: 1,
    thickness: 3.5,
    ior: 1.04,
    dispersion: 0,
    clearcoat: 0.28,
    clearcoatRoughness: 0.12,
    attenuationColor: 0xbdeaff,
    attenuationDistance: 26,
    specularIntensity: 0.38,
    transmissionResolution: 1024,
    transmissionSamples: 10,
    transmissionBackside: true,
    transmissionBacksideThickness: 0.5,
    chromaticAberration: 0.005,
    anisotropicBlur: 0.02,
    distortion: 0.035,
    distortionScale: 0.22,
    surfaceRandomness: 0.41,
    surfaceVariation: 0.24,
    tintHue: 190,
    tintIntensity: 0.83,
    transmissionBrightness: 2,
    surfaceRenderOrder: 20,
    depthWrite: false,
    bevelRadius: 0.09,
    bevelSegments: 5,
    edgeColor: 0x83e5ff,
    edgeOpacity: 0,
    labelWidth: UEFI_FIRMWARE_CONFIG.width * 0.96,
    labelOptions: {
      panel: false,
      titleFont: monospaceFont(900, 300),
    },
  });
  group.add(stageLayer.group);

  const services = UEFI_FIRMWARE_CONFIG.services.map((definition) => {
    const service = createInfoCard({
      title: definition.title,
      width: definition.size[0],
      height: definition.size[1],
      depth: definition.size[2],
      edgeColor: 0x76ddff,
      labelPlacement: "front",
      renderOrder: 25,
    });
    service.group.position.fromArray(definition.position);
    group.add(service.group);
    stageLayer.registerTransmissionForeground(service.group);
    return { definition, service };
  });
  const usbService = UEFI_FIRMWARE_CONFIG.services.find(
    ({ id }) => id === "usb-boot-service",
  );
  const bootManager = UEFI_FIRMWARE_CONFIG.services.find(
    ({ id }) => id === "boot-manager",
  );
  const anchors = Object.freeze({
    bootManager: createLayerAnchor(bootManager.position, bootManager.size),
  });
  const usbServiceCable = createTransientSignalCable({
    name: "usb-stick-to-boot-service",
    points: createUsbServiceRoute(usbService),
    ...UEFI_FIRMWARE_CONFIG.signalCable,
  });
  const bootManagerCable = createTransientSignalCable({
    name: "boot-service-to-manager",
    points: createBootManagerRoute(usbService, bootManager),
    cable: {
      ...UEFI_FIRMWARE_CONFIG.signalCable.cable,
      radius: 0.036,
      tubularSegments: 72,
    },
    energyFlow: {
      ...UEFI_FIRMWARE_CONFIG.signalCable.energyFlow,
      count: 8,
      cableRadius: 0.036,
    },
    head: {
      ...UEFI_FIRMWARE_CONFIG.signalCable.head,
      scale: 0.11,
      lightDistance: 0.9,
    },
  });
  group.add(
    usbServiceCable.group,
    bootManagerCable.group,
  );

  const setState = ({
    layerProgress = 0,
    usbServiceProgress = 0,
    bootManagerProgress = 0,
    usbPathProgress = 0,
    bootManagerPathProgress = 0,
    flowPhase = 0,
    cableRetreatProgress = 0,
    retreatProgress = 0,
    opacity = 1,
  } = {}) => {
    const lift = intervalProgress(layerProgress, 0, 0.48);
    const expansion = intervalProgress(layerProgress, 0.48, 1);
    const layerVisibility = intervalProgress(layerProgress, 0, 0.16);
    const usbServiceIn = smootherstep(usbServiceProgress);
    const bootManagerIn = smootherstep(bootManagerProgress);
    const usbPath = smootherstep(usbPathProgress);
    const bootManagerPath = smootherstep(bootManagerPathProgress);
    const cableRetreat = smootherstep(cableRetreatProgress);
    const retreat = smootherstep(retreatProgress);
    const activeOpacity = (1 - retreat) * opacity;
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
    usbServiceCable.setState({
      revealProgress: usbPath,
      signalProgress: usbPath,
      retractProgress: cableRetreat,
      flowPhase,
      opacity: activeOpacity,
    });
    bootManagerCable.setState({
      revealProgress: bootManagerPath,
      signalProgress: bootManagerPath,
      retractProgress: cableRetreat,
      flowPhase: flowPhase + 0.37,
      opacity: activeOpacity,
    });
  };
  setState();

  return {
    anchors,
    group,
    prepareRender(renderer, scene, camera) {
      stageLayer.prepareRender(renderer, scene, camera);
    },
    setGlassOptics(settings) {
      stageLayer.setTransmissionOptics(settings);
    },
    setState,
    dispose() {
      services.forEach(({ service }) => service.dispose());
      usbServiceCable.dispose();
      bootManagerCable.dispose();
      stageLayer.dispose();
      group.removeFromParent();
    },
  };
}
