import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";
import { createPlasmaGlowTexture } from "../effects/create-plasma-glow-texture.js";

const FLOW_DASH_COUNT = 18;
const CABLE_AXIS = new THREE.Vector3(0, 0, 1);
const PULSE_SCALE = 0.52;

function indexCountAt(geometry, progress) {
  const indexCount = geometry.index?.count || 0;
  const triangleCount = Math.floor((indexCount * progress) / 3);
  return triangleCount * 3;
}

function setCableMaterialProgress(geometry, revealProgress) {
  geometry.setDrawRange(0, indexCountAt(geometry, revealProgress));
}

// Ein einziges Standardmaterial, das idle und powered entlang der
// Kabellänge (uv.x) weich mischt. Die Signalkante wandert dadurch
// kontinuierlich statt dreiecksweise zu springen.
function createCableMaterial(accentColor) {
  const uniforms = {
    uSignal: { value: 0 },
    uFade: { value: 0.035 },
    uIdleColor: { value: new THREE.Color(0x59636c) },
    uPoweredColor: { value: new THREE.Color(accentColor) },
    uPoweredEmissive: { value: new THREE.Color(accentColor).multiplyScalar(0.82) },
    uIdleRoughness: { value: 0.2 },
    uPoweredRoughness: { value: 0.24 },
    uIdleMetalness: { value: 0.82 },
    uPoweredMetalness: { value: 0.52 },
  };
  const material = new THREE.MeshStandardMaterial({ transparent: true });
  material.defines = { USE_UV: "" };
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

export function createCable({ points, accentColor = 0x69c7ff }) {
  const group = new THREE.Group();
  group.name = "cable";
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const flowTangent = new THREE.Vector3();

  const cableGeometry = new THREE.TubeGeometry(curve, 128, 0.075, 10, false);
  const { material: cableMaterial, uniforms: cableUniforms } = createCableMaterial(accentColor);
  group.add(new THREE.Mesh(cableGeometry, cableMaterial));

  const flowDashGeometry = new THREE.TorusGeometry(0.079, 0.012, 6, 18);
  const flowDashMaterial = new THREE.MeshBasicMaterial({
    color: 0x9cddff,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.56,
    transparent: true,
    toneMapped: false,
  });
  const flowDashes = Array.from({ length: FLOW_DASH_COUNT }, (_, index) => {
    const dash = new THREE.Mesh(flowDashGeometry, flowDashMaterial);
    dash.name = `power-flow-dash-${index + 1}`;
    dash.renderOrder = 5;
    group.add(dash);
    return dash;
  });

  const pulse = new THREE.Group();
  pulse.name = "power-impulse";
  pulse.scale.setScalar(PULSE_SCALE);

  const plasmaTexture = createPlasmaGlowTexture();
  const plasmaLayerSpecs = [
    { blending: THREE.NormalBlending, color: 0xf1fdff, opacity: 0.9, position: [0, 0, 0.04], rotation: 0.1, scale: [1.5, 1.25], spin: 4.5 },
    { color: 0xaeeeff, opacity: 0.15, position: [0.04, -0.03, -0.08], rotation: 0.8, scale: [2.1, 1.72], spin: -3.8 },
    { color: accentColor, opacity: 0.12, position: [-0.08, 0.06, -0.24], rotation: -0.55, scale: [3.5, 2.7], spin: 4.5 },
    { color: 0x3c91ff, opacity: 0.06, position: [0.12, -0.08, -0.42], rotation: 1.35, scale: [4.8, 3.5], spin: -3.8 },
    { color: 0x79cfff, opacity: 0.1, position: [-0.14, 0.09, -0.58], rotation: -1.1, scale: [1.7, 1.18], spin: 4.5 },
    { color: 0x3c91ff, opacity: 0.05, position: [0.13, -0.06, -0.82], rotation: 0.45, scale: [1.25, 0.82], spin: -3.8 },
    // Anamorpher Streak: fix horizontal (Lens-Flare-Look), rotiert nicht mit.
    { color: 0x9cddff, opacity: 0.12, position: [0, 0, -0.1], rotation: 0, scale: [6.2, 0.3], spin: 0 },
  ];
  const plasmaLayers = plasmaLayerSpecs.map((spec, index) => {
    const material = new THREE.SpriteMaterial({
      map: plasmaTexture,
      color: spec.color,
      blending: spec.blending ?? THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      rotation: spec.rotation,
      transparent: true,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.name = `plasma-layer-${index + 1}`;
    sprite.position.fromArray(spec.position);
    sprite.scale.set(spec.scale[0], spec.scale[1], 1);
    sprite.renderOrder = 8 + index;
    pulse.add(sprite);
    return { material, spec, sprite };
  });
  const pulseLight = new THREE.PointLight(accentColor, 0, 3.8, 2);
  pulse.add(pulseLight);
  group.add(pulse);

  let opacity = 1;
  let reveal = 0;
  let signal = 0;
  let signalActive = false;
  let flow = 0;

  const render = () => {
    const easedReveal = smootherstep(reveal);
    const signalProgress = smootherstep(signal);
    group.visible = opacity > 0.001 && easedReveal > 0.001;
    cableMaterial.opacity = opacity;
    flowDashMaterial.opacity = opacity * 0.56;
    setCableMaterialProgress(cableGeometry, easedReveal);
    cableUniforms.uSignal.value = Math.min(signalProgress, easedReveal);

    flowDashes.forEach((dash, index) => {
      const dashProgress = (flow + index / FLOW_DASH_COUNT) % 1;
      dash.visible = group.visible
        && signalProgress > 0.03
        && dashProgress < signalProgress - 0.018;
      if (!dash.visible) return;
      curve.getPointAt(dashProgress, dash.position);
      dash.quaternion.setFromUnitVectors(
        CABLE_AXIS,
        curve.getTangentAt(dashProgress, flowTangent).normalize(),
      );
    });

    const signalEnvelope = signalActive
      ? Math.min(1, Math.max(0, (1 - signalProgress) / 0.08))
      : 0;
    curve.getPointAt(signalProgress, pulse.position);
    pulse.quaternion.setFromUnitVectors(
      CABLE_AXIS,
      curve.getTangentAt(signalProgress, flowTangent).normalize(),
    );
    pulse.visible = group.visible && signalEnvelope > 0.001;
    plasmaLayers[0].material.depthTest = signalProgress < 0.06
      || signalProgress > 0.9;
    plasmaLayers.forEach(({ material, spec, sprite }, index) => {
      const turbulence = 1 + Math.sin(signalProgress * 24 + index * 1.7) * 0.08;
      material.opacity = opacity * signalEnvelope * spec.opacity;
      material.rotation = spec.rotation + signalProgress * spec.spin;
      sprite.scale.set(
        spec.scale[0] * turbulence,
        spec.scale[1] / turbulence,
        1,
      );
    });
    pulseLight.intensity = opacity * signalEnvelope * 3;
  };

  return {
    curve,
    group,

    setOpacity(value) {
      opacity = value;
      render();
    },

    setRevealProgress(value) {
      reveal = value;
      render();
    },

    setSignalProgress(value, active = value > 0 && value < 1) {
      signal = value;
      signalActive = active;
      render();
    },

    setFlowProgress(value) {
      flow = value;
      render();
    },

    dispose() {
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
