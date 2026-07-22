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

export function createWorkshopMachine(tracker, lane) {
  const machine = createVectorMachine({
    tracker,
    id: lane.id,
    title: lane.title,
    size: [1.68, 1.28, 1.48],
    panelColor: FACTORY_PALETTE.panel,
    panelTopColor: FACTORY_PALETTE.panelLight,
    edgeColor: FACTORY_PALETTE.edge,
    lampCount: lane.lampCount,
  });
  return anchorVectorMachineToSurface(machine, {
    surface: FACTORY_BUILDER_SURFACE,
    x: lane.x,
    z: lane.z,
  });
}

export function createWorkshopConsole(tracker, {
  width,
  initialCopy,
  version = null,
}) {
  const group = new THREE.Group();
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

export function attachWorkshopConsoleToMachine(machine, console) {
  console.group.position.set(0, machine.height + 0.78, 0);
  machine.group.add(console.group);
  console.machine = machine;
  return console;
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
