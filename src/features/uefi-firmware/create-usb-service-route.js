import * as THREE from "three";

export function createUsbServiceRoute(usbService) {
  const [usbX, usbY, usbZ] = usbService.position;
  const usbRightEdge = usbX + usbService.size[0] / 2;
  return [
    new THREE.Vector3(5.15, -0.87, 1.55),
    new THREE.Vector3(4.35, -0.87, 1.55),
    new THREE.Vector3(3.72, -0.84, 1.55),
    new THREE.Vector3(3.34, -0.8, 1.55),
    new THREE.Vector3(3.22, -0.76, 1.55),
    new THREE.Vector3(3.14, -0.68, 1.55),
    new THREE.Vector3(3.1, -0.56, 1.55),
    new THREE.Vector3(3.1, 0.42, 1.55),
    new THREE.Vector3(3.06, 0.51, 1.55),
    new THREE.Vector3(2.98, 0.57, 1.48),
    new THREE.Vector3(2.88, usbY, 1.36),
    new THREE.Vector3(2.88, usbY, 1.08),
    new THREE.Vector3(2.84, usbY, 0.96),
    new THREE.Vector3(usbRightEdge, usbY, usbZ),
  ];
}

export function createBootManagerRoute(usbService, bootManager) {
  const [usbX, usbY, usbZ] = usbService.position;
  const [managerX, managerY, managerZ] = bootManager.position;
  const startX = usbX - usbService.size[0] / 2;
  const endX = managerX + bootManager.size[0] / 2;
  const middleX = (startX + endX) / 2;
  return [
    new THREE.Vector3(startX, usbY, usbZ),
    new THREE.Vector3(startX - 0.24, usbY, usbZ),
    new THREE.Vector3(startX - 0.4, usbY + 0.07, usbZ),
    new THREE.Vector3(middleX, usbY + 0.1, usbZ),
    new THREE.Vector3(endX + 0.4, managerY + 0.07, managerZ),
    new THREE.Vector3(endX + 0.24, managerY, managerZ),
    new THREE.Vector3(endX, managerY, managerZ),
  ];
}
