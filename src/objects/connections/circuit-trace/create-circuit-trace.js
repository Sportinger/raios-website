import * as THREE from "three";
import { smootherstep } from "../../../animation/progress.js";
import { disposeObject3D } from "../../../shared/dispose-object-3d.js";

export function createCircuitTrace({
  points,
  color = 0x61d8ff,
  segments = 48,
  renderOrder = 6,
}) {
  const group = new THREE.Group();
  group.name = "circuit-trace";
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(segments));
  geometry.setDrawRange(0, 0);
  const material = new THREE.LineBasicMaterial({
    blending: THREE.AdditiveBlending,
    color,
    opacity: 0,
    transparent: true,
  });
  const line = new THREE.Line(geometry, material);
  line.renderOrder = renderOrder;
  group.add(line);

  const setState = ({ progress = 0, opacity = 1, pulse = 0 } = {}) => {
    const reveal = smootherstep(progress);
    group.visible = reveal > 0.001 && opacity > 0.001;
    geometry.setDrawRange(0, Math.ceil(reveal * (segments + 1)));
    material.opacity = opacity * (0.42 + pulse * 0.58);
  };
  setState();

  return {
    group,
    setState,
    dispose() {
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
