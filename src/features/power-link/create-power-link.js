import { smootherstep } from "../../animation/progress.js";
import { createTransientSignalCable } from "../../objects/connections/transient-signal-cable/index.js";
import { POWER_LINK_DEFAULTS } from "./config.js";

export function createPowerLink({ points, config: overrides = {} }) {
  const config = {
    ...POWER_LINK_DEFAULTS,
    ...overrides,
    cable: { ...POWER_LINK_DEFAULTS.cable, ...overrides.cable },
    energyFlow: {
      ...POWER_LINK_DEFAULTS.energyFlow,
      ...overrides.energyFlow,
    },
    plasmaPulse: {
      ...POWER_LINK_DEFAULTS.plasmaPulse,
      ...overrides.plasmaPulse,
    },
  };
  const signalCable = createTransientSignalCable({
    name: "power-link",
    points,
    accentColor: config.accentColor,
    cable: config.cable,
    energyFlow: config.energyFlow,
    head: config.plasmaPulse,
  });

  const setState = ({
    revealProgress = 1,
    signalProgress = 0,
    signalActive = false,
    flowProgress = 0,
    opacity = 1,
  } = {}) => {
    const easedSignalProgress = smootherstep(signalProgress);
    signalCable.setState({
      revealProgress,
      signalProgress,
      flowPhase: flowProgress * config.flowCycles,
      pulseActive: signalActive,
      pulseOccludeCore: easedSignalProgress < config.coreOcclusionStart
        || easedSignalProgress > config.coreOcclusionEnd,
      opacity,
    });
  };

  setState();

  return {
    curve: signalCable.curve,
    group: signalCable.group,
    setState,
    dispose() {
      signalCable.dispose();
    },
  };
}
