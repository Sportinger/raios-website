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

function setCableMaterialProgress(geometry, revealProgress, signalProgress) {
  const visibleCount = indexCountAt(geometry, revealProgress);
  const poweredCount = Math.min(visibleCount, indexCountAt(geometry, signalProgress));
  geometry.clearGroups();
  if (poweredCount > 0) geometry.addGroup(0, poweredCount, 1);
  if (visibleCount > poweredCount) {
    geometry.addGroup(poweredCount, visibleCount - poweredCount, 0);
  }
  geometry.setDrawRange(0, visibleCount);
}

export function createCable({ points, accentColor = 0x69c7ff }) {
  const group = new THREE.Group();
  group.name = "cable";
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const flowTangent = new THREE.Vector3();

  const cableGeometry = new THREE.TubeGeometry(curve, 128, 0.075, 10, false);
  const idleMaterial = new THREE.MeshStandardMaterial({
    color: 0x59636c,
    metalness: 0.82,
    roughness: 0.2,
    transparent: true,
  });
  const poweredMaterial = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.82,
    metalness: 0.52,
    roughness: 0.24,
    transparent: true,
  });
  group.add(new THREE.Mesh(cableGeometry, [idleMaterial, poweredMaterial]));

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
  const pulseMaterial = new THREE.MeshBasicMaterial({
    color: 0xe5f8ff,
    depthWrite: true,
    toneMapped: false,
  });
  const pulseCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 24, 18),
    pulseMaterial,
  );
  pulseCore.scale.set(1.15, 1.15, 2.65);
  pulse.add(pulseCore);

  const plasmaTexture = createPlasmaGlowTexture();
  const plasmaLayerSpecs = [
    { blending: THREE.NormalBlending, color: 0xf1fdff, opacity: 1, position: [0, 0, 0.04], rotation: 0.1, scale: [1.65, 1.36] },
    { color: 0xaeeeff, opacity: 0.52, position: [0.04, -0.03, -0.08], rotation: 0.8, scale: [2.1, 1.72] },
    { color: accentColor, opacity: 0.25, position: [-0.08, 0.06, -0.24], rotation: -0.55, scale: [3.5, 2.7] },
    { color: 0x3c91ff, opacity: 0.1, position: [0.12, -0.08, -0.42], rotation: 1.35, scale: [4.8, 3.5] },
    { color: 0x79cfff, opacity: 0.22, position: [-0.14, 0.09, -0.58], rotation: -1.1, scale: [1.7, 1.18] },
    { color: 0x3c91ff, opacity: 0.1, position: [0.13, -0.06, -0.82], rotation: 0.45, scale: [1.25, 0.82] },
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
    idleMaterial.opacity = opacity;
    poweredMaterial.opacity = opacity;
    flowDashMaterial.opacity = opacity * 0.56;
    setCableMaterialProgress(cableGeometry, easedReveal, signalProgress);

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
    plasmaLayers.forEach(({ material, spec, sprite }, index) => {
      const turbulence = 1 + Math.sin(signalProgress * 24 + index * 1.7) * 0.08;
      material.opacity = opacity * signalEnvelope * spec.opacity;
      material.rotation = spec.rotation
        + signalProgress * (index % 2 === 0 ? 4.5 : -3.8);
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
