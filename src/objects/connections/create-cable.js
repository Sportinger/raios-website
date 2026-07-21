import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";
import { createRadialGlowTexture } from "../effects/create-radial-glow-texture.js";

const FLOW_DASH_COUNT = 18;
const CABLE_AXIS = new THREE.Vector3(0, 0, 1);

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
  const pulseMaterial = new THREE.MeshBasicMaterial({
    color: 0xe5f8ff,
    depthWrite: false,
    transparent: true,
    toneMapped: false,
  });
  pulse.add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), pulseMaterial));

  const shockRingMaterial = new THREE.MeshBasicMaterial({
    color: 0xd8f7ff,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0,
    side: THREE.DoubleSide,
    transparent: true,
    toneMapped: false,
  });
  const outerShockRingMaterial = shockRingMaterial.clone();
  outerShockRingMaterial.color.set(accentColor);
  pulse.add(new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.026, 8, 48),
    shockRingMaterial,
  ));
  pulse.add(new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.016, 8, 64),
    outerShockRingMaterial,
  ));

  const glowTexture = createRadialGlowTexture();
  const innerHaloMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    color: 0xd8f7ff,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    toneMapped: false,
  });
  const outerHaloMaterial = innerHaloMaterial.clone();
  outerHaloMaterial.color.set(accentColor);
  const auraMaterial = outerHaloMaterial.clone();
  auraMaterial.color.set(0x3c9eff);
  const innerHalo = new THREE.Sprite(innerHaloMaterial);
  innerHalo.scale.setScalar(0.82);
  pulse.add(innerHalo);
  const outerHalo = new THREE.Sprite(outerHaloMaterial);
  outerHalo.scale.setScalar(2.8);
  pulse.add(outerHalo);
  const aura = new THREE.Sprite(auraMaterial);
  aura.scale.setScalar(5.6);
  pulse.add(aura);
  const pulseLight = new THREE.PointLight(accentColor, 0, 7, 2);
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
    pulseMaterial.opacity = opacity * signalEnvelope;
    shockRingMaterial.opacity = opacity * signalEnvelope * 0.92;
    outerShockRingMaterial.opacity = opacity * signalEnvelope * 0.48;
    innerHaloMaterial.opacity = opacity * signalEnvelope * 0.92;
    outerHaloMaterial.opacity = opacity * signalEnvelope * 0.38;
    auraMaterial.opacity = opacity * signalEnvelope * 0.15;
    pulseLight.intensity = opacity * signalEnvelope * 8;
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
