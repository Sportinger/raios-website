import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createHorizontalLabel } from "../../objects/labels/create-horizontal-label.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";
import { UEFI_FIRMWARE_CONFIG } from "./config.js";

function createCircuitTrace(source, target) {
  const positions = new Float32Array(6);
  source.toArray(positions, 0);
  source.toArray(positions, 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    blending: THREE.AdditiveBlending,
    color: 0x55d6ff,
    opacity: 0,
    transparent: true,
  });
  const cursor = new THREE.Vector3();
  return {
    geometry,
    line: new THREE.Line(geometry, material),
    material,
    render(progress, opacity) {
      cursor.copy(source).lerp(target, progress).toArray(positions, 3);
      geometry.attributes.position.needsUpdate = true;
      material.opacity = opacity;
    },
  };
}

export function createUefiFirmware() {
  const group = new THREE.Group();
  group.name = "uefi-firmware";
  const source = new THREE.Vector3().fromArray(UEFI_FIRMWARE_CONFIG.source);
  const traces = UEFI_FIRMWARE_CONFIG.endpoints.map((endpoint) => (
    createCircuitTrace(source, new THREE.Vector3().fromArray(endpoint))
  ));
  traces.forEach((trace) => group.add(trace.line));

  const layerGroup = new THREE.Group();
  layerGroup.name = "uefi-layer";
  const geometry = new THREE.BoxGeometry(
    UEFI_FIRMWARE_CONFIG.width,
    UEFI_FIRMWARE_CONFIG.height,
    UEFI_FIRMWARE_CONFIG.depth,
  );
  const material = new THREE.MeshStandardMaterial({
    color: 0x0b8fc0,
    emissive: 0x28cfff,
    emissiveIntensity: 0.22,
    metalness: 0.18,
    opacity: 0,
    roughness: 0.24,
    transparent: true,
  });
  layerGroup.add(new THREE.Mesh(geometry, material));
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x83e5ff,
    opacity: 0,
    transparent: true,
  });
  layerGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial));
  const label = createHorizontalLabel(
    "UEFI FIRMWARE",
    "MACHINE FIRMWARE",
    UEFI_FIRMWARE_CONFIG.width * 0.58,
    UEFI_FIRMWARE_CONFIG.depth * 0.38,
  );
  label.plane.position.y = UEFI_FIRMWARE_CONFIG.height / 2 + 0.012;
  layerGroup.add(label.plane);
  group.add(layerGroup);

  const setState = ({
    patternProgress = 0,
    layerProgress = 0,
    retreatProgress = 0,
    opacity = 1,
  } = {}) => {
    const pattern = smootherstep(patternProgress);
    const layer = smootherstep(layerProgress);
    const retreat = smootherstep(retreatProgress);
    traces.forEach((trace, index) => {
      const traceProgress = smootherstep(intervalProgress(
        pattern,
        index * 0.07,
        0.58 + index * 0.07,
      ));
      trace.render(traceProgress, traceProgress * (1 - retreat) * opacity * 0.9);
    });
    layerGroup.visible = layer > 0.001 && retreat < 0.999;
    layerGroup.position.y = THREE.MathUtils.lerp(
      -0.68,
      UEFI_FIRMWARE_CONFIG.layerY,
      layer * (1 - retreat),
    );
    material.opacity = layer * (1 - retreat) * opacity * 0.28;
    edgeMaterial.opacity = layer * (1 - retreat) * opacity * 0.9;
    label.material.opacity = smootherstep(intervalProgress(layer, 0.62, 1))
      * (1 - retreat)
      * opacity;
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
