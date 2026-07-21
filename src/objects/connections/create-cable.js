import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";

function setGeometryProgress(geometry, progress) {
  const indexCount = geometry.index?.count || 0;
  const triangleCount = Math.floor((indexCount * progress) / 3);
  geometry.setDrawRange(0, triangleCount * 3);
}

export function createCable({ points, accentColor = 0x69c7ff }) {
  const group = new THREE.Group();
  group.name = "cable";
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");

  const sheathGeometry = new THREE.TubeGeometry(curve, 128, 0.075, 10, false);
  const sheathMaterial = new THREE.MeshStandardMaterial({
    color: 0x59636c,
    metalness: 0.82,
    roughness: 0.2,
    transparent: true,
  });
  group.add(new THREE.Mesh(sheathGeometry, sheathMaterial));

  const signalGeometry = new THREE.TubeGeometry(curve, 128, 0.078, 10, false);
  const signalMaterial = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.9,
    metalness: 0.52,
    roughness: 0.24,
    transparent: true,
  });
  group.add(new THREE.Mesh(signalGeometry, signalMaterial));

  const glowGeometry = new THREE.TubeGeometry(curve, 128, 0.13, 10, false);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: accentColor,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.14,
    transparent: true,
    toneMapped: false,
  });
  group.add(new THREE.Mesh(glowGeometry, glowMaterial));

  const pulse = new THREE.Group();
  pulse.name = "power-impulse";
  const pulseMaterial = new THREE.MeshBasicMaterial({
    color: 0xe5f8ff,
    toneMapped: false,
  });
  pulse.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), pulseMaterial));

  const pulseHaloMaterial = new THREE.MeshBasicMaterial({
    color: accentColor,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    toneMapped: false,
  });
  pulse.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 20, 14),
    pulseHaloMaterial,
  ));
  const pulseLight = new THREE.PointLight(accentColor, 0, 4.5, 2);
  pulse.add(pulseLight);
  group.add(pulse);

  let opacity = 1;
  let reveal = 0;
  let signal = 0;
  let signalActive = false;

  const render = () => {
    const easedReveal = smootherstep(reveal);
    const signalProgress = smootherstep(signal);
    group.visible = opacity > 0.001 && easedReveal > 0.001;
    sheathMaterial.opacity = opacity;
    signalMaterial.opacity = opacity * 0.9;
    glowMaterial.opacity = opacity * 0.14;
    setGeometryProgress(sheathGeometry, easedReveal);
    setGeometryProgress(signalGeometry, Math.min(easedReveal, signalProgress));
    setGeometryProgress(glowGeometry, Math.min(easedReveal, signalProgress));

    const signalEnvelope = signalActive
      ? Math.min(1, Math.max(0, (1 - signalProgress) / 0.08))
      : 0;
    curve.getPointAt(signalProgress, pulse.position);
    pulse.visible = group.visible && signalEnvelope > 0.001;
    pulseMaterial.opacity = opacity * signalEnvelope;
    pulseHaloMaterial.opacity = opacity * signalEnvelope * 0.34;
    pulseLight.intensity = opacity * signalEnvelope * 5.5;
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

    dispose() {
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
