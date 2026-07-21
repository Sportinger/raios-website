import * as THREE from "three";
import { clamp, smootherstep } from "../../../animation/progress.js";
import { disposeObject3D } from "../../../shared/dispose-object-3d.js";

const STREAM_AXIS = new THREE.Vector3(0, 0, 1);

export function createDataStream({
  points,
  count = 14,
  color = 0x76d5ff,
  blockSize = [0.2, 0.08, 0.34],
  trailLength = 0.38,
}) {
  const group = new THREE.Group();
  group.name = "data-stream";
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const geometry = new THREE.BoxGeometry(...blockSize);
  const material = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    color,
    depthWrite: false,
    opacity: 0.86,
    transparent: true,
    toneMapped: false,
  });
  const tangent = new THREE.Vector3();
  const blocks = Array.from({ length: count }, (_, index) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `data-block-${index + 1}`;
    group.add(mesh);
    return mesh;
  });

  const setState = ({ progress = 0, opacity = 1 } = {}) => {
    const head = smootherstep(progress);
    group.visible = opacity > 0.001 && head > 0.001 && progress < 1;
    material.opacity = opacity * 0.86;
    blocks.forEach((block, index) => {
      const offset = (index / Math.max(1, count - 1)) * trailLength;
      const position = head - offset;
      block.visible = group.visible && position >= 0 && position <= 1;
      if (!block.visible) return;
      const curveProgress = clamp(position);
      curve.getPointAt(curveProgress, block.position);
      block.quaternion.setFromUnitVectors(
        STREAM_AXIS,
        curve.getTangentAt(curveProgress, tangent).normalize(),
      );
    });
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
