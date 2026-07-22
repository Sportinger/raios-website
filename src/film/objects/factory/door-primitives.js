import * as THREE from "three";
import {
  createVectorDoor,
  setVectorDoorEmergence,
  setVectorDoorPorchAngle,
} from "../shared/vector-door.js";
import { FACTORY_PALETTE } from "./config.js";

const FACTORY_DOOR_MODEL_SCALE = 2.45;

export function createFactoryDoor(tracker, color, position = [0, 0, 0], scale = 1) {
  const group = new THREE.Group();
  group.name = "factory-door";
  group.position.set(...position);
  group.scale.setScalar(scale);
  const mechanism = createVectorDoor({
    tracker,
    edgeColor: color,
    panelColor: FACTORY_PALETTE.panelLight,
    panelEdgeColor: color,
    lineDark: FACTORY_PALETTE.panel,
    amber: FACTORY_PALETTE.amber,
    thresholdColor: color,
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

export function orientFactoryDoor(door, {
  yaw = Math.PI / 4,
  porchWorldAngle = yaw,
  porchWorldRotation = 0,
} = {}) {
  door.group.rotation.y = yaw;
  setVectorDoorPorchAngle(door.mechanism, porchWorldAngle - yaw);
  // Keep the landing in the deck's world grid even though the frame itself
  // billboards toward the fixed 2.5D film camera.
  door.mechanism.hatch.group.rotation.y = porchWorldRotation - yaw;
}
