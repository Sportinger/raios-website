import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createHorizontalLabel } from "../../objects/labels/create-horizontal-label.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";
import { BOOT_USB_CONFIG } from "./config.js";

export function createBootUsb() {
  const group = new THREE.Group();
  group.name = "raios-boot-usb";
  const bodyGroup = new THREE.Group();
  const [bodyWidth, bodyHeight, bodyDepth] = BOOT_USB_CONFIG.bodySize;
  const bodyGeometry = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b1722,
    emissive: 0x1677a4,
    emissiveIntensity: 0.15,
    metalness: 0.68,
    roughness: 0.28,
  });
  bodyGroup.add(new THREE.Mesh(bodyGeometry, bodyMaterial));
  const bodyEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(bodyGeometry),
    new THREE.LineBasicMaterial({ color: 0x6bcfff, transparent: true }),
  );
  bodyGroup.add(bodyEdges);

  const connectorGeometry = new THREE.BoxGeometry(...BOOT_USB_CONFIG.connectorSize);
  const connector = new THREE.Mesh(
    connectorGeometry,
    new THREE.MeshStandardMaterial({ color: 0xadb7c2, metalness: 0.9, roughness: 0.18 }),
  );
  connector.position.x = -bodyWidth / 2 - BOOT_USB_CONFIG.connectorSize[0] / 2;
  bodyGroup.add(connector);
  const label = createHorizontalLabel(
    "RAIOS BOOT USB",
    "",
    bodyWidth,
    bodyHeight / 0.7,
    {
      panel: false,
      titleFont: "900 230px ui-monospace, SFMono-Regular, Consolas, monospace",
      descriptionFont: "600 66px ui-monospace, SFMono-Regular, Consolas, monospace",
    },
  );
  label.plane.position.z = bodyDepth / 2 + 0.012;
  label.plane.rotation.x = 0;
  bodyGroup.add(label.plane);
  group.add(bodyGroup);

  const startPosition = new THREE.Vector3().fromArray(BOOT_USB_CONFIG.startPosition);
  const dockedPosition = new THREE.Vector3().fromArray(BOOT_USB_CONFIG.dockedPosition);

  const setState = ({
    insertProgress = 0,
    searchProgress = 0,
    partitionProgress = 0,
    fileProgress = 0,
    dimProgress = 0,
    opacity = 1,
  } = {}) => {
    const insert = smootherstep(insertProgress);
    const dim = smootherstep(dimProgress);
    const read = smootherstep(searchProgress);
    bodyGroup.position.lerpVectors(startPosition, dockedPosition, insert);
    bodyGroup.visible = insertProgress > 0.001;
    bodyMaterial.emissiveIntensity = THREE.MathUtils.lerp(
      0.15 + Math.sin(read * Math.PI) * 0.62,
      0.04,
      dim,
    );
    bodyEdges.material.opacity = opacity * THREE.MathUtils.lerp(1, 0.3, dim);
    label.material.opacity = smootherstep(intervalProgress(insert, 0.45, 0.85))
      * opacity;
  };
  setState();

  return {
    group,
    setState,
    dispose() {
      disposeObject3D(bodyGroup);
      group.removeFromParent();
    },
  };
}
