import * as THREE from "three";
import { POWER_ON_LAYOUT } from "./layout.js";

export function createPowerOnCableRoute({
  buttonPosition,
  layerContact,
  cameraPosition,
}) {
  const buttonNormal = cameraPosition.clone().sub(buttonPosition).normalize();
  const behindButton = buttonNormal.clone().negate();
  const behindOnLevel = behindButton.clone().setY(0).normalize();
  const socket = buttonPosition.clone().addScaledVector(
    behindButton,
    POWER_ON_LAYOUT.buttonSocketDepth,
  );
  const rearRun = socket.clone().addScaledVector(
    behindOnLevel,
    POWER_ON_LAYOUT.buttonRearRun,
  );
  const floorEntry = rearRun.clone()
    .lerp(layerContact, 0.08)
    .setY(POWER_ON_LAYOUT.cableFloorY);
  const towardButton = buttonPosition.clone().sub(layerContact).setY(0).normalize();
  const floorEnd = layerContact.clone()
    .addScaledVector(towardButton, 0.62)
    .setY(POWER_ON_LAYOUT.cableFloorY);
  const floorDirection = floorEnd.clone().sub(floorEntry).normalize();
  const sideways = new THREE.Vector3(-floorDirection.z, 0, floorDirection.x);
  const floorPointAt = (progress, sideOffset) => floorEntry.clone()
    .lerp(floorEnd, progress)
    .addScaledVector(sideways, sideOffset);

  return [
    socket,
    rearRun,
    floorEntry,
    floorPointAt(0.2, 0.62),
    floorPointAt(0.42, -0.78),
    floorPointAt(0.64, 0.56),
    floorPointAt(0.84, -0.3),
    floorEnd,
    layerContact,
  ];
}
