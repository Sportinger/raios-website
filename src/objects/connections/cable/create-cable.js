import * as THREE from "three";
import { smootherstep } from "../../../animation/progress.js";
import { disposeObject3D } from "../../../shared/dispose-object-3d.js";
import { CABLE_DEFAULTS } from "./config.js";

function indexCountAt(geometry, progress) {
  const indexCount = geometry.index?.count || 0;
  return Math.floor((indexCount * progress) / 3) * 3;
}

function createCableMaterial(config) {
  const poweredColor = new THREE.Color(config.poweredColor);
  const uniforms = {
    uSignal: { value: 0 },
    uFade: { value: config.signalFade },
    uIdleColor: { value: new THREE.Color(config.idleColor) },
    uPoweredColor: { value: poweredColor },
    uPoweredEmissive: {
      value: poweredColor.clone().multiplyScalar(config.poweredEmissiveStrength),
    },
    uIdleRoughness: { value: config.idleRoughness },
    uPoweredRoughness: { value: config.poweredRoughness },
    uIdleMetalness: { value: config.idleMetalness },
    uPoweredMetalness: { value: config.poweredMetalness },
  };
  const material = new THREE.MeshStandardMaterial({
    transparent: config.transparent,
  });
  material.defines = { USE_UV: "" };
  material.customProgramCacheKey = () => "raios-progressive-cable-v1";
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uSignal;
        uniform float uFade;
        uniform vec3 uIdleColor;
        uniform vec3 uPoweredColor;
        uniform vec3 uPoweredEmissive;
        uniform float uIdleRoughness;
        uniform float uPoweredRoughness;
        uniform float uIdleMetalness;
        uniform float uPoweredMetalness;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float poweredMix = 1.0 - smoothstep(uSignal - uFade, uSignal, vUv.x);
        diffuseColor.rgb = mix(uIdleColor, uPoweredColor, poweredMix);`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(uIdleRoughness, uPoweredRoughness, poweredMix);`,
      )
      .replace(
        "#include <metalnessmap_fragment>",
        `#include <metalnessmap_fragment>
        metalnessFactor = mix(uIdleMetalness, uPoweredMetalness, poweredMix);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        totalEmissiveRadiance = uPoweredEmissive * poweredMix;`,
      );
  };
  return { material, uniforms };
}

export function createCable({ points, config: overrides = {} }) {
  const config = { ...CABLE_DEFAULTS, ...overrides };
  const group = new THREE.Group();
  group.name = "cable";

  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const geometry = new THREE.TubeGeometry(
    curve,
    config.tubularSegments,
    config.radius,
    config.radialSegments,
    false,
  );
  const { material, uniforms } = createCableMaterial(config);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "cable-surface";
  group.add(mesh);

  const setState = ({
    revealProgress = 1,
    energizedProgress = 0,
    opacity = 1,
  } = {}) => {
    const reveal = smootherstep(revealProgress);
    const energized = smootherstep(energizedProgress);
    group.visible = opacity > 0.001 && reveal > 0.001;
    material.opacity = opacity;
    geometry.setDrawRange(0, indexCountAt(geometry, reveal));
    uniforms.uSignal.value = Math.min(energized, reveal);
  };

  setState();

  return {
    curve,
    group,
    setState,
    dispose() {
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
