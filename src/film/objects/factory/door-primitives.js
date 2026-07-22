import * as THREE from "three";
import {
  anchorVectorDoorToSurface,
  attachVectorDoorLabel,
  createVectorDoor,
  createVectorDoorLabel,
  setVectorDoorEmergence,
  setVectorDoorLifecycle,
  setVectorDoorOpen,
} from "../shared/vector-door.js";
import {
  FILM_DOOR_SCALE,
  FOUNDATION_PRESENTATION_SCALE,
} from "../../layout-constants.js";

const FACTORY_DOOR_MODEL_SCALE = 2.45;
export const FACTORY_STANDARD_DOOR_SCALE = (
  FILM_DOOR_SCALE * FOUNDATION_PRESENTATION_SCALE / FACTORY_DOOR_MODEL_SCALE
);

function createFactoryDoorMechanism(
  tracker,
  color,
  position = [0, 0, 0],
  scale = 1,
  { rotationY = 0, porchSide = 1 } = {},
) {
  const group = new THREE.Group();
  group.name = "factory-door";
  group.position.set(...position);
  group.scale.setScalar(scale);
  const mechanism = createVectorDoor({
    tracker,
    edgeColor: color,
    panelColor: 0x101a28,
    panelEdgeColor: 0x4c91d9,
    lineDark: 0x29425d,
    amber: 0xf6c769,
    thresholdColor: 0xb6d9ff,
    rotationY,
    porchSide,
  });
  mechanism.group.scale.setScalar(FACTORY_DOOR_MODEL_SCALE);
  group.add(mechanism.group);
  return {
    ...mechanism,
    group,
    mechanism,
    baseScale: scale,
  };
}

export function setFactoryDoorEmergence(door, state) {
  door.group.scale.setScalar(door.baseScale);
  setVectorDoorEmergence(door.mechanism, state);
}

export function setFactoryDoorLifecycle(door, time, lifecycle) {
  door.group.scale.setScalar(door.baseScale);
  return setVectorDoorLifecycle(door.mechanism, time, lifecycle);
}

export function createFactoryDoorOnSurface(tracker, color, {
  surface,
  edge,
  along = 0,
  scale = FACTORY_STANDARD_DOOR_SCALE,
  label,
  labelColor = 0xf6c769,
} = {}) {
  const door = createFactoryDoorMechanism(
    tracker,
    color,
    [0, 0, 0],
    scale,
  );
  anchorVectorDoorToSurface(door, { surface, edge, along });
  if (label) {
    attachVectorDoorLabel(door.mechanism, createVectorDoorLabel({
      tracker,
      text: label,
      color: labelColor,
    }));
    door.label = door.mechanism.label;
  }
  return door;
}

export function createFreestandingFactoryDoor(tracker, color, {
  position = [0, 0, 0],
  scale = 1,
  rotationY = 0,
  porchSide = 1,
  label,
  labelColor = 0xf6c769,
} = {}) {
  const door = createFactoryDoorMechanism(
    tracker,
    color,
    position,
    scale,
    { rotationY, porchSide },
  );
  if (label) {
    attachVectorDoorLabel(door.mechanism, createVectorDoorLabel({
      tracker,
      text: label,
      color: labelColor,
    }));
    door.label = door.mechanism.label;
  }
  return door;
}

export function setFactoryDoorOpen(door, amount) {
  setVectorDoorOpen(door.mechanism, amount);
}
