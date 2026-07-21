import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";

const ORBIT_ANGLE = THREE.MathUtils.degToRad(240);
const ORBIT_RADIUS = 1.68;
const POLAR_END = Math.PI * 0.92;

export function createOrbitingLight({ color = 0xffffff } = {}) {
  const group = new THREE.Group();
  group.name = "orbiting-light";

  const coreMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    toneMapped: false,
  });
  group.add(new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 12), coreMaterial));

  const haloMaterial = new THREE.MeshBasicMaterial({
    color,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    toneMapped: false,
  });
  group.add(new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 12), haloMaterial));

  const light = new THREE.PointLight(color, 0, 4.8, 2);
  group.add(light);

  return {
    group,

    setProgress(value) {
      const progress = smootherstep(value);
      const polar = progress * POLAR_END;
      const azimuth = progress * ORBIT_ANGLE;
      const projectedRadius = Math.sin(polar) * ORBIT_RADIUS;
      const envelope = Math.pow(Math.sin(Math.PI * progress), 0.3);

      group.visible = envelope > 0.001;
      group.position.set(
        Math.cos(azimuth) * projectedRadius,
        -Math.cos(polar) * ORBIT_RADIUS,
        -Math.sin(azimuth) * projectedRadius,
      );
      coreMaterial.opacity = envelope;
      haloMaterial.opacity = envelope * 0.34;
      light.intensity = envelope * 7.2;
    },

    dispose() {
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
