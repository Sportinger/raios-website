import * as THREE from "three";
import { MeshTransmissionMaterial } from "@pmndrs/vanilla/materials/MeshTransmissionMaterial.js";
import { createProceduralGlassNormalMap } from "./create-procedural-glass-normal-map.js";

export function createMeshTransmissionSurface({
  geometry,
  materialOptions,
  resolution = 1024,
  samples = 10,
  chromaticAberration = 0.04,
  anisotropicBlur = 0.08,
  distortion = 0.01,
  distortionScale = 0.3,
  backside = false,
  backsideThickness = 0.5,
  surfaceVariation = 0,
}) {
  const renderTarget = new THREE.WebGLRenderTarget(resolution, resolution, {
    depthBuffer: true,
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearFilter,
    type: THREE.HalfFloatType,
  });
  renderTarget.texture.name = "transmission-scene-buffer";
  const backsideTarget = backside
    ? renderTarget.clone()
    : null;
  if (backsideTarget) {
    backsideTarget.texture.name = "transmission-backside-buffer";
  }

  const {
    attenuationColor,
    attenuationDistance,
    roughness,
    thickness,
    transmission,
    ...physicalOptions
  } = materialOptions;
  const material = new MeshTransmissionMaterial({
    samples,
    buffer: renderTarget.texture,
    chromaticAberration,
    anisotropicBlur,
    distortion,
    distortionScale,
    roughness,
    thickness,
    attenuationColor: new THREE.Color(attenuationColor),
    attenuationDistance,
    _transmission: transmission,
  });
  material.setValues(physicalOptions);
  material.transparent = true;
  const proceduralNormalMap = surfaceVariation > 0
    ? createProceduralGlassNormalMap()
    : null;
  if (proceduralNormalMap) {
    material.normalMap = proceduralNormalMap;
    material.normalScale.setScalar(surfaceVariation);
    material.needsUpdate = true;
  }

  const surface = new THREE.Mesh(geometry, material);
  const foregroundObjects = [];
  let currentBacksideThickness = backsideThickness;
  let renderingBuffer = false;
  const prepareRender = (renderer, scene, camera) => {
    if (renderingBuffer || !surface.visible) {
      return;
    }

    renderingBuffer = true;
    const previousTarget = renderer.getRenderTarget();
    const previousToneMapping = renderer.toneMapping;
    const previousXrEnabled = renderer.xr.enabled;
    const previousSide = material.side;
    const previousThickness = material.thickness;
    const previousBuffer = material.buffer;
    const foregroundVisibility = foregroundObjects.map((object) => object.visible);
    surface.visible = false;
    foregroundObjects.forEach((object) => {
      object.visible = false;
    });
    try {
      renderer.xr.enabled = false;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.setRenderTarget(backsideTarget ?? renderTarget);
      renderer.clear();
      renderer.render(scene, camera);

      if (backsideTarget) {
        surface.visible = true;
        material.buffer = backsideTarget.texture;
        material.thickness = currentBacksideThickness;
        material.side = THREE.BackSide;
        renderer.setRenderTarget(renderTarget);
        renderer.clear();
        renderer.render(scene, camera);
      }
    } finally {
      material.buffer = previousBuffer;
      material.thickness = previousThickness;
      material.side = previousSide;
      renderer.setRenderTarget(previousTarget);
      renderer.toneMapping = previousToneMapping;
      renderer.xr.enabled = previousXrEnabled;
      surface.visible = true;
      foregroundObjects.forEach((object, index) => {
        object.visible = foregroundVisibility[index];
      });
      renderingBuffer = false;
    }
  };

  return {
    addForegroundObject(object) {
      foregroundObjects.push(object);
    },
    material,
    prepareRender,
    setOptics({
      ior,
      frontThickness,
      backThickness,
      surfaceVariation: variation = material.normalScale.x,
    }) {
      material.ior = THREE.MathUtils.clamp(ior, 1, 2.33);
      material.thickness = Math.max(0, frontThickness);
      currentBacksideThickness = Math.max(0, backThickness);
      if (proceduralNormalMap) {
        material.normalScale.setScalar(THREE.MathUtils.clamp(variation, 0, 0.5));
      }
    },
    surface,
    dispose() {
      backsideTarget?.dispose();
      proceduralNormalMap?.dispose();
      renderTarget.dispose();
    },
  };
}
