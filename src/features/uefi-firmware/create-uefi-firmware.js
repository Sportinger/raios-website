import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createInfoCard } from "../../objects/cards/index.js";
import { createCircuitTrace } from "../../objects/connections/circuit-trace/index.js";
import { createHorizontalLabel } from "../../objects/labels/create-horizontal-label.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";
import { UEFI_FIRMWARE_CONFIG } from "./config.js";

export function createUefiFirmware() {
  const group = new THREE.Group();
  group.name = "uefi-firmware";
  const source = new THREE.Vector3().fromArray(UEFI_FIRMWARE_CONFIG.source);
  const collapsedScale = new THREE.Vector3(
    UEFI_FIRMWARE_CONFIG.sourceSize[0] / UEFI_FIRMWARE_CONFIG.width,
    UEFI_FIRMWARE_CONFIG.sourceSize[1] / UEFI_FIRMWARE_CONFIG.height,
    UEFI_FIRMWARE_CONFIG.sourceSize[2] / UEFI_FIRMWARE_CONFIG.depth,
  );
  const sourceLight = new THREE.PointLight(0x55d6ff, 0, 3.2, 2);
  sourceLight.position.copy(source).setY(source.y + 0.24);
  group.add(sourceLight);

  const layerGroup = new THREE.Group();
  layerGroup.name = "uefi-boot-environment";
  const geometry = new THREE.BoxGeometry(
    UEFI_FIRMWARE_CONFIG.width,
    UEFI_FIRMWARE_CONFIG.height,
    UEFI_FIRMWARE_CONFIG.depth,
  );
  const material = new THREE.MeshStandardMaterial({
    color: 0x087ca8,
    emissive: 0x28cfff,
    emissiveIntensity: 0.22,
    metalness: 0.12,
    opacity: 0,
    roughness: 0.22,
    transparent: true,
    depthWrite: false,
  });
  layerGroup.add(new THREE.Mesh(geometry, material));
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x83e5ff,
    opacity: 0,
    transparent: true,
  });
  layerGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial));
  const label = createHorizontalLabel(
    "UEFI BOOT ENVIRONMENT",
    "",
    UEFI_FIRMWARE_CONFIG.width * 0.96,
    0.88,
    {
      panel: false,
      titleFont: "900 360px ui-monospace, SFMono-Regular, Consolas, monospace",
    },
  );
  label.plane.position.set(
    0,
    0,
    UEFI_FIRMWARE_CONFIG.depth / 2 + 0.012,
  );
  label.plane.rotation.x = 0;
  layerGroup.add(label.plane);
  group.add(layerGroup);

  const services = UEFI_FIRMWARE_CONFIG.services.map((definition) => {
    const service = createInfoCard({
      title: definition.title,
      description: definition.description,
      width: definition.size[0],
      height: definition.size[1],
      depth: definition.size[2],
      color: 0x092033,
      edgeColor: 0x76ddff,
    });
    service.group.position.fromArray(definition.position);
    group.add(service.group);
    return { definition, service };
  });
  const usbService = UEFI_FIRMWARE_CONFIG.services.find(
    ({ id }) => id === "usb-boot-service",
  );
  const usbServicePath = createCircuitTrace({
    points: [
      new THREE.Vector3(...usbService.position),
      new THREE.Vector3(2.5, 0.44, 1.18),
      new THREE.Vector3(3.1, -0.28, 1.42),
      new THREE.Vector3(3.55, -0.79, 1.55),
    ],
    color: 0x79e3ff,
  });
  group.add(usbServicePath.group);

  const setState = ({
    patternProgress = 0,
    layerProgress = 0,
    serviceProgress = 0,
    usbActivityProgress = 0,
    retreatProgress = 0,
    opacity = 1,
  } = {}) => {
    const pattern = smootherstep(patternProgress);
    const lift = smootherstep(intervalProgress(layerProgress, 0, 0.48));
    const expansion = smootherstep(intervalProgress(layerProgress, 0.48, 1));
    const layerVisibility = smootherstep(intervalProgress(layerProgress, 0, 0.16));
    const servicesIn = smootherstep(serviceProgress);
    const retreat = smootherstep(retreatProgress);
    const activeOpacity = (1 - retreat) * opacity;
    sourceLight.intensity = Math.sin(pattern * Math.PI) * activeOpacity * 2.2;
    layerGroup.visible = layerVisibility > 0.001 && retreat < 0.999;
    const deployedLift = lift * (1 - retreat);
    const deployedExpansion = expansion * (1 - retreat);
    layerGroup.position.set(
      0,
      THREE.MathUtils.lerp(
        UEFI_FIRMWARE_CONFIG.source[1],
        UEFI_FIRMWARE_CONFIG.layerY,
        deployedLift,
      ),
      0,
    );
    layerGroup.scale.set(
      THREE.MathUtils.lerp(collapsedScale.x, 1, deployedExpansion),
      THREE.MathUtils.lerp(collapsedScale.y, 1, deployedExpansion),
      THREE.MathUtils.lerp(collapsedScale.z, 1, deployedExpansion),
    );
    material.opacity = layerVisibility * activeOpacity * 0.28;
    edgeMaterial.opacity = layerVisibility * activeOpacity * 0.9;
    label.material.opacity = smootherstep(intervalProgress(expansion, 0.18, 0.72))
      * activeOpacity;
    services.forEach(({ service }, index) => service.setState({
      progress: intervalProgress(servicesIn, index * 0.16, 0.68 + index * 0.16),
      activationProgress: 1,
      opacity: activeOpacity,
    }));
    const usbActivity = smootherstep(usbActivityProgress);
    usbServicePath.setState({
      progress: servicesIn,
      opacity: activeOpacity * 0.78,
      pulse: Math.sin(usbActivity * Math.PI),
    });
  };
  setState();

  return {
    group,
    setState,
    dispose() {
      services.forEach(({ service }) => service.dispose());
      usbServicePath.dispose();
      disposeObject3D(layerGroup);
      group.removeFromParent();
    },
  };
}
