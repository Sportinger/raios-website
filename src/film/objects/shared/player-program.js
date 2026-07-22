import {
  createVectorMachine,
  setVectorMachineBuild,
} from "./vector-machine.js";

export const PLAYER_PROGRAM_STYLE = Object.freeze({
  size: Object.freeze([1.06, 0.86, 0.94]),
  panelColor: 0x17263a,
  panelTopColor: 0x263a52,
  edgeColor: 0x8bc5ff,
});

export function createPlayerProgram({
  tracker,
  id = "player-program",
  title = "PLAYER.RS",
} = {}) {
  const machine = createVectorMachine({
    tracker,
    id,
    title,
    size: PLAYER_PROGRAM_STYLE.size,
    panelColor: PLAYER_PROGRAM_STYLE.panelColor,
    panelTopColor: PLAYER_PROGRAM_STYLE.panelTopColor,
    edgeColor: PLAYER_PROGRAM_STYLE.edgeColor,
    lampCount: 0,
  });
  setVectorMachineBuild(machine, {
    outlineAmount: 1,
    riseAmount: 1,
    outlineOpacity: 0,
  });
  return machine;
}
