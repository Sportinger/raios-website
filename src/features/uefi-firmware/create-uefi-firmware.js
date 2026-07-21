import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createInfoCard } from "../../objects/cards/index.js";
import { createTransientSignalCable } from "../../objects/connections/transient-signal-cable/index.js";
import { createExpandingStageLayer } from "../../objects/layers/expanding-stage-layer/index.js";
import { UEFI_FIRMWARE_CONFIG } from "./config.js";
import {
  createBootManagerRoute,
  createUsbServiceRoute,
} from "./create-usb-service-route.js";

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
    color: UEFI_FIRMWARE_CONFIG.color,
    emissive: 0x28cfff,
    emissiveIntensity: 0.22,
    metalness: 0.12,
    roughness: 0.22,
    surfaceOpacity: UEFI_FIRMWARE_CONFIG.surfaceOpacity,
    surfaceRenderOrder: 3,
    depthWrite: true,
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
      color: UEFI_FIRMWARE_CONFIG.color,
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
  const usbServiceCable = createTransientSignalCable({
    name: "usb-stick-to-boot-service",
    points: createUsbServiceRoute(usbService),
  });
  const bootManagerCable = createTransientSignalCable({
    name: "boot-service-to-manager",
    points: createBootManagerRoute(usbService, bootManager),
    cable: { radius: 0.036, tubularSegments: 72 },
    energyFlow: { count: 8, cableRadius: 0.036 },
    head: { scale: 0.11, lightDistance: 0.9 },
  });
  group.add(
    usbServiceCable.group,
    bootManagerCable.group,
  );

  const setState = ({
    patternProgress = 0,
    layerProgress = 0,
    opacityBoostProgress = 0,
    usbServiceProgress = 0,
    bootManagerProgress = 0,
    usbPathProgress = 0,
    bootManagerPathProgress = 0,
    flowPhase = 0,
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
        UEFI_FIRMWARE_CONFIG.finalSurfaceOpacity
          / UEFI_FIRMWARE_CONFIG.surfaceOpacity,
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
    usbServiceCable.setState({
      headProgress: smootherstep(usbPathProgress),
      flowPhase,
      opacity: activeOpacity,
    });
    bootManagerCable.setState({
      headProgress: smootherstep(bootManagerPathProgress),
      flowPhase: flowPhase + 0.37,
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
      bootManagerCable.dispose();
      stageLayer.dispose();
      group.removeFromParent();
    },
  };
}
