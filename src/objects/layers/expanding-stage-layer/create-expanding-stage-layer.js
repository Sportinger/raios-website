import * as THREE from "three";
import { smootherstep } from "../../../animation/progress.js";
import { disposeObject3D } from "../../../shared/dispose-object-3d.js";
import { createHorizontalLabel } from "../../labels/create-horizontal-label.js";

export function createExpandingStageLayer({
  name = "expanding-stage-layer",
  title,
  sourcePosition,
  targetPosition,
  sourceSize,
  size,
  color = 0x0b1b29,
  edgeColor = 0x72dbff,
  emissive = edgeColor,
  emissiveIntensity = 0.18,
  metalness = 0.35,
  roughness = 0.3,
  surfaceOpacity = 0.8,
  edgeOpacity = 1,
  depthWrite = false,
  retreatOffset = [-8, 0, 0],
  labelWidth = size[0] * 0.92,
  labelOptions,
}) {
  const group = new THREE.Group();
  group.name = name;
  const source = new THREE.Vector3(...sourcePosition);
  const target = new THREE.Vector3(...targetPosition);
  const retreat = new THREE.Vector3(...retreatOffset);
  const collapsedScale = new THREE.Vector3(
    sourceSize[0] / size[0],
    sourceSize[1] / size[1],
    sourceSize[2] / size[2],
  );
  const geometry = new THREE.BoxGeometry(...size);
  const material = new THREE.MeshStandardMaterial({
    color,
    depthWrite,
    emissive,
    emissiveIntensity,
    metalness,
    opacity: 0,
    roughness,
    transparent: true,
  });
  group.add(new THREE.Mesh(geometry, material));
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: edgeColor,
    opacity: 0,
    transparent: true,
  });
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial));
  const label = createHorizontalLabel(
    title,
    "",
    labelWidth,
    size[1] / 0.7,
    labelOptions,
  );
  label.plane.position.z = size[2] / 2 + 0.012;
  label.plane.rotation.x = 0;
  group.add(label.plane);

  const setState = ({
    revealProgress = 0,
    liftProgress = 0,
    expansionProgress = 0,
    labelProgress = expansionProgress,
    labelOpacity = 1,
    surfaceOpacityScale = 1,
    retreatProgress = 0,
    opacity = 1,
  } = {}) => {
    const reveal = smootherstep(revealProgress);
    const lift = smootherstep(liftProgress);
    const expansion = smootherstep(expansionProgress);
    const exit = smootherstep(retreatProgress);
    const activeOpacity = opacity * (1 - exit);
    group.visible = reveal > 0.001 && exit < 0.999;
    group.position.lerpVectors(source, target, lift).addScaledVector(retreat, exit);
    group.scale.set(
      THREE.MathUtils.lerp(collapsedScale.x, 1, expansion),
      THREE.MathUtils.lerp(collapsedScale.y, 1, expansion),
      THREE.MathUtils.lerp(collapsedScale.z, 1, expansion),
    );
    material.opacity = Math.min(
      1,
      reveal * activeOpacity * surfaceOpacity * surfaceOpacityScale,
    );
    edgeMaterial.opacity = reveal * activeOpacity * edgeOpacity;
    label.material.opacity = smootherstep(labelProgress) * labelOpacity * activeOpacity;
    return { activeOpacity, expansion, exit, lift, reveal };
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
