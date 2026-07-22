import * as THREE from "three";
import { createTextLabel } from "./primitives.js";
import { FACTORY_BUILDER_SURFACE, FACTORY_PALETTE } from "./config.js";
import {
  anchorVectorMachineToSurface,
  createVectorMachine,
} from "../shared/vector-machine.js";

function createSolidSprite(tracker, color, width, height, opacity = 1) {
  const material = tracker.material(new THREE.SpriteMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    depthTest: false,
    depthWrite: false,
  }));
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width, height, 1);
  sprite.renderOrder = 42;
  return sprite;
}

function createBadgeSprite(tracker, copy, owner = false) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const texture = tracker.texture(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = tracker.material(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  }));
  const badge = new THREE.Sprite(material);
  badge.scale.set(0.58, 0.58, 1);
  badge.renderOrder = 48;
  const draw = (passed = false) => {
    const fill = passed ? "#3faf6b" : owner ? "#5b4013" : "#69181d";
    const stroke = passed ? "#a3f3c0" : owner ? "#e3b257" : "#ff6e68";
    const text = passed ? "#d9f8e5" : owner ? "#e9c77f" : "#ff918c";
    context.clearRect(0, 0, 256, 256);
    context.beginPath();
    context.arc(128, 128, 88, 0, Math.PI * 2);
    context.fillStyle = fill;
    context.fill();
    context.lineWidth = 14;
    context.strokeStyle = stroke;
    context.stroke();
    context.font = "900 92px Consolas, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = 20;
    context.strokeStyle = "#07101a";
    context.strokeText(copy, 128, 134);
    context.fillStyle = text;
    context.fillText(copy, 128, 134);
    texture.needsUpdate = true;
  };
  badge.userData.setPassed = draw;
  draw(false);
  return badge;
}

export function createWorkshopMachine(tracker, lane) {
  const machine = createVectorMachine({
    tracker,
    id: lane.id,
    title: lane.title,
    subtitle: lane.subtitle,
    size: [1.68, 1.28, 1.48],
    panelColor: FACTORY_PALETTE.panel,
    panelTopColor: FACTORY_PALETTE.panelLight,
    edgeColor: FACTORY_PALETTE.edge,
    statusColor: lane.color,
    titleColor: FACTORY_PALETTE.white,
    subtitleColor: 0xaab5c5,
    detailColor: FACTORY_PALETTE.amber,
  });
  return anchorVectorMachineToSurface(machine, {
    surface: FACTORY_BUILDER_SURFACE,
    x: lane.x,
    z: lane.z,
  });
}

export function createWorkshopConsole(tracker, {
  position,
  width,
  initialCopy,
  version = null,
}) {
  const group = new THREE.Group();
  group.position.set(...position);
  const railBorder = createSolidSprite(tracker, 0x36536f, width + 0.06, 0.16);
  const rail = createSolidSprite(tracker, FACTORY_PALETTE.ink, width, 0.11);
  rail.position.z = 0.01;
  const fill = createSolidSprite(tracker, 0x7894b3, width - 0.08, 0.075);
  fill.position.z = 0.02;
  fill.scale.x = 0.001;
  const caption = createTextLabel(tracker, {
    text: initialCopy,
    width: width + 1.15,
    height: 0.36,
    color: 0xafc2d9,
    background: FACTORY_PALETTE.ink,
    position: [0, 0.34, 0.03],
    fontSize: 43,
    billboard: true,
  });
  const versionCaption = version ? createTextLabel(tracker, {
    text: version,
    width: width + 0.45,
    height: 0.29,
    color: 0x718197,
    background: FACTORY_PALETTE.ink,
    position: [0, -0.34, 0.03],
    fontSize: 36,
    billboard: true,
  }) : null;
  group.add(railBorder, rail, fill, caption);
  if (versionCaption) group.add(versionCaption);
  return { group, railBorder, rail, fill, caption, versionCaption, width: width - 0.08 };
}

export function setWorkshopConsole(console, value, copy, state = "building") {
  const progress = THREE.MathUtils.clamp(value, 0, 1);
  console.fill.scale.x = Math.max(0.001, progress * console.width);
  console.fill.position.x = -console.width / 2 + progress * console.width / 2;
  console.fill.material.color.setHex(
    state === "failed" ? 0xb7605c : state === "passed" ? 0x78947f : 0x7894b3,
  );
  console.caption.userData.setText?.(copy);
}

export function createWorkshopChecklist(tracker) {
  const group = new THREE.Group();
  group.name = "workshop-guard-checklist";
  const screenRightStep = new THREE.Vector3(0.57, 0, -0.57);
  const badges = ["R", "#", "C", "U"].map((copy, index) => {
    const badge = createBadgeSprite(tracker, copy, index === 3);
    badge.position.copy(screenRightStep).multiplyScalar(index);
    group.add(badge);
    return badge;
  });
  group.position.set(-3.698, 1.3, 3.888);
  return { group, badges };
}
