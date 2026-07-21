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
  surfaceRenderOrder = 0,
  edgeOpacity = 1,
  depthWrite = false,
  recenterOnExpansion = false,
  retreatOffset = [-8, 0, 0],
  labelWidth = size[0] * 0.92,
  labelOptions,
}) {
  const group = new THREE.Group();
  group.name = name;
  const scalePivot = new THREE.Group();
  scalePivot.name = `${name}-scale-pivot`;
  const contentGroup = new THREE.Group();
  contentGroup.name = `${name}-content`;
  group.add(scalePivot);
  scalePivot.add(contentGroup);
  const source = new THREE.Vector3(...sourcePosition);
  const target = new THREE.Vector3(...targetPosition);
  const retreat = new THREE.Vector3(...retreatOffset);
  const collapsedScale = new THREE.Vector3(
    sourceSize[0] / size[0],
    sourceSize[1] / size[1],
    sourceSize[2] / size[2],
  );
  const expansionPivot = new THREE.Vector3(
    collapsedScale.x < 0.999
      ? (source.x - target.x) / (1 - collapsedScale.x)
      : 0,
    0,
    collapsedScale.z < 0.999
      ? (source.z - target.z) / (1 - collapsedScale.z)
      : 0,
  );
  if (recenterOnExpansion) {
    scalePivot.position.copy(expansionPivot);
    contentGroup.position.copy(expansionPivot).negate();
  }
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
  const surface = new THREE.Mesh(geometry, material);
  surface.renderOrder = surfaceRenderOrder;
  contentGroup.add(surface);
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: edgeColor,
    opacity: 0,
    transparent: true,
  });
  contentGroup.add(
    new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial),
  );
  const label = createHorizontalLabel(
    title,
    "",
    labelWidth,
    size[1] / 0.7,
    labelOptions,
  );
  label.plane.position.z = size[2] / 2 + 0.012;
  label.plane.rotation.x = 0;
  contentGroup.add(label.plane);
  const scalingLabels = [label];

  const setState = ({
    revealProgress = 0,
    surfaceProgress = revealProgress,
    liftProgress = 0,
    expansionProgress = 0,
    alignmentProgress = liftProgress,
    labelProgress = expansionProgress,
    labelOpacity = 1,
    surfaceOpacityScale = 1,
    retreatProgress = 0,
    opacity = 1,
  } = {}) => {
    const reveal = smootherstep(revealProgress);
    const surfaceReveal = smootherstep(surfaceProgress);
    const lift = smootherstep(liftProgress);
    const expansion = smootherstep(expansionProgress);
    const alignment = smootherstep(alignmentProgress);
    const exit = smootherstep(retreatProgress);
    const activeOpacity = opacity * (1 - exit);
    group.visible = reveal > 0.001 && exit < 0.999;
    group.position.set(
      recenterOnExpansion
        ? target.x
        : THREE.MathUtils.lerp(source.x, target.x, alignment),
      THREE.MathUtils.lerp(source.y, target.y, lift),
      recenterOnExpansion
        ? target.z
        : THREE.MathUtils.lerp(source.z, target.z, alignment),
    ).addScaledVector(retreat, exit);
    const scaleX = THREE.MathUtils.lerp(collapsedScale.x, 1, expansion);
    const scaleY = THREE.MathUtils.lerp(collapsedScale.y, 1, expansion);
    const scaleZ = THREE.MathUtils.lerp(collapsedScale.z, 1, expansion);
    scalePivot.scale.set(scaleX, scaleY, scaleZ);
    const uniformLabelScale = Math.min(scaleX, scaleY);
    scalingLabels.forEach((scalingLabel) => {
      scalingLabel.setScaleCompensation(scaleX, scaleY, uniformLabelScale);
    });
    material.opacity = Math.min(
      1,
      surfaceReveal * activeOpacity * surfaceOpacity * surfaceOpacityScale,
    );
    edgeMaterial.opacity = reveal * activeOpacity * edgeOpacity;
    label.material.opacity = smootherstep(labelProgress) * labelOpacity * activeOpacity;
    return { activeOpacity, alignment, expansion, exit, lift, reveal };
  };
  setState();

  return {
    contentGroup,
    group,
    registerScalingLabel(scalingLabel) {
      scalingLabels.push(scalingLabel);
    },
    setState,
    dispose() {
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
