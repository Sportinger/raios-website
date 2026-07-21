import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createLightRig } from "../objects/environment/create-light-rig.js";
import { createStarField } from "../objects/environment/create-star-field.js";
import { disposeObject3D } from "../shared/dispose-object-3d.js";

export function createWorld(renderer) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070a, 0.045);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnvironment = new RoomEnvironment();
  const environmentMap = pmremGenerator.fromScene(roomEnvironment, 0.04).texture;
  roomEnvironment.dispose();
  pmremGenerator.dispose();
  scene.environment = environmentMap;
  scene.environmentIntensity = 0.72;

  const environment = new THREE.Group();
  environment.name = "environment";
  const lightRig = createLightRig();
  const starField = createStarField(170);
  starField.setOpacity(0);
  environment.add(lightRig.group, starField.group);
  scene.add(environment);

  return {
    lightRig,
    scene,
    setBackgroundProgress(progress) {
      starField.setOpacity(progress);
    },
    dispose() {
      scene.environment = null;
      environmentMap.dispose();
      disposeObject3D(environment);
      environment.removeFromParent();
    },
  };
}
