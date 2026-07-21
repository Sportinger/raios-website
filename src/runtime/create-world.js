import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { createLightRig } from "../objects/environment/create-light-rig.js";
import { createStarField } from "../objects/environment/create-star-field.js";
import { createTableSurface } from "../objects/environment/create-table-surface.js";
import { disposeObject3D } from "../shared/dispose-object-3d.js";

const STUDIO_ENVIRONMENT_URL = new URL(
  "../assets/environment/monochrome_studio_04_2k.hdr",
  import.meta.url,
).href;
const STUDIO_ENVIRONMENT_INTENSITY = 0.78;

export function createWorld(renderer) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070a, 0.045);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnvironment = new RoomEnvironment();
  let environmentMap = pmremGenerator.fromScene(roomEnvironment, 0.04).texture;
  let disposed = false;
  roomEnvironment.dispose();
  scene.environment = environmentMap;
  scene.environmentIntensity = 0;
  scene.environmentRotation.y = THREE.MathUtils.degToRad(95);
  pmremGenerator.compileEquirectangularShader();
  new RGBELoader().load(
    STUDIO_ENVIRONMENT_URL,
    (studioTexture) => {
      if (disposed) {
        studioTexture.dispose();
        return;
      }
      const studioEnvironment = pmremGenerator
        .fromEquirectangular(studioTexture)
        .texture;
      studioTexture.dispose();
      environmentMap.dispose();
      environmentMap = studioEnvironment;
      scene.environment = environmentMap;
      pmremGenerator.dispose();
    },
    undefined,
    (error) => {
      pmremGenerator.dispose();
      if (!disposed) {
        console.warn("The studio HDR environment could not be loaded", error);
      }
    },
  );

  const environment = new THREE.Group();
  environment.name = "environment";
  const lightRig = createLightRig();
  const starField = createStarField(170);
  const tableSurface = createTableSurface();
  starField.setOpacity(0);
  environment.add(lightRig.group, starField.group, tableSurface);
  scene.add(environment);

  return {
    lightRig,
    scene,
    setBackgroundProgress(progress) {
      starField.setOpacity(progress);
    },
    setEnvironmentProgress(progress) {
      scene.environmentIntensity = STUDIO_ENVIRONMENT_INTENSITY
        * THREE.MathUtils.clamp(progress, 0, 1);
    },
    setEnvironmentRotation(degrees) {
      scene.environmentRotation.y = THREE.MathUtils.degToRad(degrees);
    },
    dispose() {
      disposed = true;
      pmremGenerator.dispose();
      scene.environment = null;
      environmentMap.dispose();
      disposeObject3D(environment);
      environment.removeFromParent();
    },
  };
}
