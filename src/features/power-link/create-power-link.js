import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";
import { createCable } from "../../objects/connections/cable/index.js";
import { createEnergyFlow } from "../../objects/effects/energy-flow/index.js";
import { createPlasmaPulse } from "../../objects/effects/plasma-pulse/index.js";
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
  const group = new THREE.Group();
  group.name = "power-link";

  const cable = createCable({
    points,
    config: {
      ...config.cable,
      poweredColor: config.cable.poweredColor ?? config.accentColor,
    },
  });
  const energyFlow = createEnergyFlow({
    curve: cable.curve,
    config: config.energyFlow,
  });
  const plasmaPulse = createPlasmaPulse({
    curve: cable.curve,
    accentColor: config.accentColor,
    config: config.plasmaPulse,
  });
  group.add(cable.group, energyFlow.group, plasmaPulse.group);

  const setState = ({
    revealProgress = 1,
    signalProgress = 0,
    signalActive = false,
    flowProgress = 0,
    opacity = 1,
  } = {}) => {
    const easedSignalProgress = smootherstep(signalProgress);
    cable.setState({
      revealProgress,
      energizedProgress: signalProgress,
      opacity,
    });
    energyFlow.setState({
      energizedProgress: signalProgress,
      phase: flowProgress * config.flowCycles,
      opacity,
    });
    plasmaPulse.setState({
      progress: signalProgress,
      active: signalActive,
      opacity,
      occludeCore: easedSignalProgress < config.coreOcclusionStart
        || easedSignalProgress > config.coreOcclusionEnd,
    });
  };

  setState();

  return {
    curve: cable.curve,
    group,
    setState,
    dispose() {
      cable.dispose();
      energyFlow.dispose();
      plasmaPulse.dispose();
      group.removeFromParent();
    },
  };
}
