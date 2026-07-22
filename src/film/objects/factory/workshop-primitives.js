import { FACTORY_BUILDER_SURFACE, FACTORY_PALETTE } from "./config.js";
import {
  anchorVectorMachineToSurface,
  createVectorMachine,
} from "../shared/vector-machine.js";

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
    progressLabel: lane.progressLabel,
  });
  return anchorVectorMachineToSurface(machine, {
    surface: FACTORY_BUILDER_SURFACE,
    x: lane.x,
    z: lane.z,
  });
}
