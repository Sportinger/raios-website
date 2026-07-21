import * as THREE from "three";

export function createLightRig() {
  const group = new THREE.Group();
  group.name = "light-rig";
  group.add(new THREE.HemisphereLight(0x8cc3ff, 0x020408, 1.15));

  const keyLight = new THREE.DirectionalLight(0xb9d9ff, 3.8);
  keyLight.position.set(4, 7, 6);
  group.add(keyLight);
  return group;
}
