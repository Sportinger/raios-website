import * as THREE from "three";
import { createLightRig } from "../objects/environment/create-light-rig.js";
import { createStarField } from "../objects/environment/create-star-field.js";

export function createWorld() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070a, 0.045);

  const environment = new THREE.Group();
  environment.name = "environment";
  environment.add(createLightRig(), createStarField(170));
  scene.add(environment);

  return { environment, scene };
}
