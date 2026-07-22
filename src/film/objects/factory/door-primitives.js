import * as THREE from "three";
import {
  createVectorDoor,
  setVectorDoorEmergence,
} from "../shared/vector-door.js";
import {
  FILM_DOOR_SCALE,
  FOUNDATION_PRESENTATION_SCALE,
} from "../../layout-constants.js";

const FACTORY_DOOR_MODEL_SCALE = 2.45;
export const FACTORY_STANDARD_DOOR_SCALE = (
  FILM_DOOR_SCALE * FOUNDATION_PRESENTATION_SCALE / FACTORY_DOOR_MODEL_SCALE
);

export function createFactoryDoor(
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
