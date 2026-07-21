import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";

export function createLightSweep({ color = 0xffffff } = {}) {
  const group = new THREE.Group();
  group.name = "light-sweep";

  const bandMaterial = new THREE.MeshBasicMaterial({
    color,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    toneMapped: false,
  });
  const band = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 2.75), bandMaterial);
  band.rotation.x = -Math.PI / 2;
  band.position.y = 0.68;
  band.renderOrder = 8;
  group.add(band);

  const light = new THREE.PointLight(color, 0, 4.2, 2);
  light.position.y = 1.15;
  group.add(light);

  return {
    group,

    setProgress(value) {
      const progress = smootherstep(value);
      const envelope = Math.sin(Math.PI * progress);
      group.visible = envelope > 0.001;
      group.position.x = THREE.MathUtils.lerp(-1.55, 1.55, progress);
      bandMaterial.opacity = envelope * 0.3;
      light.intensity = envelope * 6.2;
    },

    dispose() {
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
