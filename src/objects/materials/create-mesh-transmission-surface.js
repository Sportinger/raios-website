import * as THREE from "three";
import { MeshTransmissionMaterial } from "@pmndrs/vanilla/materials/MeshTransmissionMaterial.js";

export function createMeshTransmissionSurface({
  geometry,
  materialOptions,
  resolution = 1024,
  samples = 10,
  chromaticAberration = 0.04,
  anisotropicBlur = 0.08,
  distortion = 0.01,
  distortionScale = 0.3,
  refractionScale = 1,
  backside = false,
  backsideThickness = 0.5,
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
  material.uniforms.refractionScale = { value: refractionScale };
  const compileTransmissionShader = material.onBeforeCompile;
  material.onBeforeCompile = (shader) => {
    compileTransmissionShader(shader);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "uniform float chromaticAberration;",
        "uniform float chromaticAberration;\nuniform float refractionScale;",
      )
      .replace(
        "vec3 refractedRayExit = position + transmissionRay;",
        "vec3 refractedRayExit = position + transmissionRay * refractionScale;",
      );
  };

  const surface = new THREE.Mesh(geometry, material);
  let renderingBuffer = false;
  surface.onBeforeRender = (renderer, scene, camera) => {
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
    surface.visible = false;
    try {
      renderer.xr.enabled = false;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.setRenderTarget(backsideTarget ?? renderTarget);
      renderer.clear();
      renderer.render(scene, camera);

      if (backsideTarget) {
        surface.visible = true;
        material.buffer = backsideTarget.texture;
        material.thickness = backsideThickness;
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
      renderingBuffer = false;
    }
  };

  return {
    material,
    surface,
    dispose() {
      surface.onBeforeRender = () => {};
      backsideTarget?.dispose();
      renderTarget.dispose();
    },
  };
}
