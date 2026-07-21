const LIGHT_REVEAL_START = 0.085;
const BUTTON_PRESS_START = 0.22;
const BUTTON_PRESS_END = 0.29;
const CAMERA_FLIGHT_START = 0.36;

const segment = (start, end) => Object.freeze([start, end]);

export const POWER_ON_TIMELINE = Object.freeze({
  buttonReveal: segment(0.01, 0.16),
  symbolGlow: segment(LIGHT_REVEAL_START, 0.16),
  cameraOrbit: segment(0.17, CAMERA_FLIGHT_START),
  buttonPress: segment(BUTTON_PRESS_START, BUTTON_PRESS_END),
  buttonRelease: segment(0.3, 0.42),
  power: segment(BUTTON_PRESS_START, BUTTON_PRESS_END),
  signalTravel: segment(BUTTON_PRESS_START, 0.78),
  environmentLight: segment(LIGHT_REVEAL_START, 0.42),
  cameraFollow: segment(BUTTON_PRESS_START, 0.4),
  cameraFlight: segment(CAMERA_FLIGHT_START, 0.78),
  cameraRelease: segment(0.55, 0.74),
  bareMetalActivation: segment(0.78, 0.94),
  cameraTopDown: segment(0.78, 1),
});
