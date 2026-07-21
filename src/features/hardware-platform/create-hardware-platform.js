import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";
import { createBareMetalLayer } from "../bare-metal-layer/index.js";
import { HARDWARE_PLATFORM_CONFIG } from "./config.js";
import { createSpiFlash } from "./create-spi-flash.js";

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
    opacity: 0,
    roughness: 0.3,
    transparent: true,
  });
  group.add(new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), openingMaterial));
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x344758,
    transparent: true,
    opacity: 0,
  });
  group.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth)),
    edgeMaterial,
  ));
  return { group, openingMaterial, edgeMaterial };
}

export function createHardwarePlatform() {
  const group = new THREE.Group();
  group.name = "hardware-platform";
  const bareMetal = createBareMetalLayer();
  group.add(bareMetal.group);

  const spiFlash = createSpiFlash();
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
    const physicalReveal = 1;
    const spiPower = intervalProgress(initializationProgress, ...timing.spiPower);
    const portReveal = smootherstep(intervalProgress(usbProgress, 0.02, 0.18));
    const usbRead = intervalProgress(usbProgress, ...timing.usbRead);
    bareMetal.setState({
      revealProgress: 1,
      opacity,
      elevationProgress: 1,
      currentProgress: 1,
    });
    spiFlash.setState({
      revealProgress: physicalReveal,
      powerProgress: spiPower,
      retiredProgress: firmwareRetiredProgress,
      opacity,
    });
    usbPort.group.visible = portReveal > 0.001;
    usbPort.openingMaterial.opacity = portReveal * opacity;
    usbPort.openingMaterial.emissiveIntensity = smootherstep(usbRead) * 0.45;
    usbPort.edgeMaterial.opacity = portReveal * opacity * 0.65;
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
