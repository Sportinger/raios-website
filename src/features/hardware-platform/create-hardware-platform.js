import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createInfoCard } from "../../objects/cards/index.js";
import { createHorizontalLabel } from "../../objects/labels/create-horizontal-label.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";
import { createBareMetalLayer } from "../bare-metal-layer/index.js";
import { HARDWARE_PLATFORM_CONFIG } from "./config.js";

function createUsbPort() {
  const group = new THREE.Group();
  group.name = "physical-usb-port";
  group.position.fromArray(HARDWARE_PLATFORM_CONFIG.usbPort.position);
  const [width, height, depth] = HARDWARE_PLATFORM_CONFIG.usbPort.openingSize;
  const openingMaterial = new THREE.MeshStandardMaterial({
    color: 0x010308,
    emissive: 0x238fc2,
    emissiveIntensity: 0,
    metalness: 0.35,
    roughness: 0.3,
  });
  group.add(new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), openingMaterial));
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x344758,
    transparent: true,
    opacity: 0.65,
  });
  group.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth)),
    edgeMaterial,
  ));
  return { group, openingMaterial };
}

export function createHardwarePlatform() {
  const group = new THREE.Group();
  group.name = "hardware-platform";
  const bareMetal = createBareMetalLayer();
  group.add(bareMetal.group);

  const labelConfig = HARDWARE_PLATFORM_CONFIG.label;
  const machineLabel = createHorizontalLabel(
    labelConfig.title,
    "",
    labelConfig.size[0],
    labelConfig.size[1],
    { panel: false },
  );
  machineLabel.plane.position.fromArray(labelConfig.position);
  machineLabel.plane.rotation.x = 0;
  group.add(machineLabel.plane);

  const flashConfig = HARDWARE_PLATFORM_CONFIG.spiFlash;
  const spiFlash = createInfoCard({
    title: flashConfig.title,
    width: flashConfig.size[0],
    height: flashConfig.size[1],
    depth: flashConfig.size[2],
    color: 0x0a1119,
    edgeColor: 0x5bd8ff,
  });
  spiFlash.group.position.fromArray(flashConfig.position);
  group.add(spiFlash.group);

  const usbPort = createUsbPort();
  group.add(usbPort.group);

  const setState = ({
    hardwareProgress = 0,
    initializationProgress = 0,
    usbProgress = 0,
    firmwareRetiredProgress = 0,
    opacity = 1,
  } = {}) => {
    const timing = HARDWARE_PLATFORM_CONFIG.timing;
    const physicalReveal = intervalProgress(hardwareProgress, ...timing.physicalReveal);
    const retired = smootherstep(firmwareRetiredProgress);
    const spiPower = intervalProgress(initializationProgress, ...timing.spiPower)
      * (1 - retired);
    const usbRead = intervalProgress(usbProgress, ...timing.usbRead);
    bareMetal.setState({
      revealProgress: 1,
      opacity,
      elevationProgress: 1,
      currentProgress: intervalProgress(hardwareProgress, ...timing.surfacePower),
    });
    machineLabel.material.opacity = smootherstep(physicalReveal) * opacity * 0.72;
    spiFlash.setState({
      progress: physicalReveal,
      activationProgress: spiPower,
      pulseProgress: Math.sin(spiPower * Math.PI),
      opacity,
    });
    usbPort.group.visible = physicalReveal > 0.001;
    usbPort.openingMaterial.emissiveIntensity = smootherstep(usbRead) * 0.45;
  };
  setState();

  return {
    group,
    setState,
    dispose() {
      bareMetal.dispose();
      spiFlash.dispose();
      disposeObject3D(usbPort.group);
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
