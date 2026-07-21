import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { smootherstep } from "../../../animation/progress.js";
import { disposeObject3D } from "../../../shared/dispose-object-3d.js";
import { createHorizontalLabel } from "../../labels/create-horizontal-label.js";
import { createMeshTransmissionSurface } from "../../materials/create-mesh-transmission-surface.js";

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
  envMapIntensity = 1,
  transmission,
  thickness,
  ior,
  clearcoat,
  clearcoatRoughness,
  attenuationColor,
  attenuationDistance,
  dispersion,
  specularIntensity,
  transmissionResolution = 1024,
  transmissionSamples = 10,
  chromaticAberration = 0.04,
  anisotropicBlur = 0.08,
  distortion = 0.01,
  distortionScale = 0.3,
  transmissionBackside = false,
  transmissionBacksideThickness = 0.5,
  surfaceRandomness = 0.72,
  surfaceVariation = 0,
  tintHue = 198,
  tintIntensity = 0.18,
  transmissionBrightness = 1,
  surfaceOpacity = 0.8,
  surfaceRenderOrder = 0,
  edgeOpacity = 1,
  depthWrite = false,
  bevelRadius = 0,
  bevelSegments = 4,
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
  const usesTransmission = transmission !== undefined;
  const geometry = bevelRadius > 0
    ? new RoundedBoxGeometry(
      size[0],
      size[1],
      size[2],
      bevelSegments,
      bevelRadius,
    )
    : new THREE.BoxGeometry(...size);
  const materialOptions = {
    color,
    depthWrite,
    emissive,
    emissiveIntensity,
    envMapIntensity,
    metalness,
    opacity: usesTransmission ? 1 : 0,
    roughness,
    transparent: !usesTransmission,
  };
  if (usesTransmission) {
    Object.assign(materialOptions, {
      attenuationColor,
      attenuationDistance,
      clearcoat,
      clearcoatRoughness,
      dispersion,
      ior,
      specularIntensity,
      thickness,
      transmission,
    });
  }
  const transmissionSurface = usesTransmission
    ? createMeshTransmissionSurface({
      geometry,
      materialOptions,
      resolution: transmissionResolution,
      samples: transmissionSamples,
      chromaticAberration,
      anisotropicBlur,
      distortion,
      distortionScale,
      backside: transmissionBackside,
      backsideThickness: transmissionBacksideThickness,
      surfaceRandomness,
      surfaceVariation,
      tintHue,
      tintIntensity,
      transmissionBrightness,
    })
    : null;
  const material = transmissionSurface?.material
    ?? new THREE.MeshStandardMaterial(materialOptions);
  const surface = transmissionSurface?.surface
    ?? new THREE.Mesh(geometry, material);
  surface.renderOrder = surfaceRenderOrder;
  contentGroup.add(surface);
  const edgeMaterial = edgeOpacity > 0
    ? new THREE.LineBasicMaterial({
      color: edgeColor,
      opacity: 0,
      transparent: true,
    })
    : null;
  if (edgeMaterial) {
    contentGroup.add(
      new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial),
    );
  }
  const label = createHorizontalLabel(
    title,
    "",
    labelWidth,
    size[1] / 0.7,
    labelOptions,
  );
  label.plane.position.z = size[2] / 2 + 0.03;
  label.plane.rotation.x = 0;
  label.plane.renderOrder = surfaceRenderOrder + 2;
  contentGroup.add(label.plane);
  if (usesTransmission) {
    transmissionSurface.addForegroundObject(label.plane);
  }
  const scalingLabels = [label];

  const setState = ({
    revealProgress = 0,
    surfaceProgress = revealProgress,
    liftProgress = 0,
    expansionProgress = 0,
    alignmentProgress = liftProgress,
    labelProgress = expansionProgress,
    labelOpacity = 1,
    emissiveIntensityScale = 1,
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
    surface.visible = surfaceReveal > 0.001 && activeOpacity > 0.001;
    if (!usesTransmission) {
      material.opacity = Math.min(
        1,
        surfaceReveal * activeOpacity * surfaceOpacity * surfaceOpacityScale,
      );
    }
    material.emissiveIntensity = emissiveIntensity * emissiveIntensityScale;
    if (edgeMaterial) {
      edgeMaterial.opacity = reveal * activeOpacity * edgeOpacity;
    }
    label.material.opacity = smootherstep(labelProgress) * labelOpacity * activeOpacity;
    return { activeOpacity, alignment, expansion, exit, lift, reveal };
  };
  setState();

  return {
    contentGroup,
    group,
    prepareRender(renderer, scene, camera) {
      transmissionSurface?.prepareRender(renderer, scene, camera);
    },
    setTransmissionOptics(settings) {
      transmissionSurface?.setOptics(settings);
    },
    registerScalingLabel(scalingLabel) {
      scalingLabels.push(scalingLabel);
    },
    registerTransmissionForeground(object) {
      transmissionSurface?.addForegroundObject(object);
    },
    setState,
    dispose() {
      transmissionSurface?.dispose();
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
