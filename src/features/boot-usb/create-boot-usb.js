import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createDataStream } from "../../objects/effects/data-stream/index.js";
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
  const label = createHorizontalLabel("RAIOS BOOT USB", "", bodyWidth, bodyDepth);
  label.plane.position.y = bodyHeight / 2 + 0.012;
  bodyGroup.add(label.plane);

  const partitionLabel = createHorizontalLabel(
    "EFI SYSTEM PARTITION · FAT32",
    "",
    bodyWidth * 0.92,
    bodyDepth * 0.56,
  );
  partitionLabel.plane.position.set(0.12, bodyHeight / 2 + 0.035, 0);
  bodyGroup.add(partitionLabel.plane);
  const fileLabel = createHorizontalLabel(
    "EFI/BOOT/BOOTX64.EFI",
    "",
    bodyWidth * 0.72,
    bodyDepth * 0.34,
  );
  fileLabel.plane.position.set(0.05, bodyHeight / 2 + 0.055, 0);
  bodyGroup.add(fileLabel.plane);
  group.add(bodyGroup);

  const searchPulse = createDataStream({
    points: [
      new THREE.Vector3(2.45, -0.61, 1.38),
      new THREE.Vector3(3.45, -0.48, 1.4),
      new THREE.Vector3(4.2, -0.3, 1.4),
      new THREE.Vector3(4.85, -0.25, 1.4),
    ],
    count: 7,
    blockSize: [0.13, 0.08, 0.22],
    trailLength: 0.28,
  });
  group.add(searchPulse.group);
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
    bodyGroup.position.lerpVectors(startPosition, dockedPosition, insert);
    bodyGroup.visible = insertProgress > 0.001;
    bodyMaterial.emissiveIntensity = THREE.MathUtils.lerp(0.15, 0.04, dim);
    bodyEdges.material.opacity = opacity * THREE.MathUtils.lerp(1, 0.3, dim);
    label.material.opacity = smootherstep(intervalProgress(insert, 0.45, 0.85))
      * (1 - smootherstep(partitionProgress))
      * opacity;
    partitionLabel.material.opacity = smootherstep(partitionProgress)
      * (1 - smootherstep(fileProgress))
      * opacity;
    fileLabel.material.opacity = smootherstep(fileProgress) * opacity;
    searchPulse.setState({ progress: searchProgress, opacity });
  };
  setState();

  return {
    group,
    setState,
    dispose() {
      searchPulse.dispose();
      disposeObject3D(bodyGroup);
      group.removeFromParent();
    },
  };
}
