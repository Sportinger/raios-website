import * as THREE from "three";
import { createCable } from "../cable/index.js";
import { createEnergyFlow } from "../../effects/energy-flow/index.js";
import { createPlasmaPulse } from "../../effects/plasma-pulse/index.js";

export function createTransientSignalCable({
  name = "transient-signal-cable",
  points,
  accentColor = 0x58d7ff,
  cable: cableConfig = {},
  energyFlow: energyFlowConfig = {},
  head: headConfig = {},
}) {
  const group = new THREE.Group();
  group.name = name;
  const cable = createCable({
    points,
    config: {
      poweredColor: accentColor,
      ...cableConfig,
    },
  });
  const resolvedEnergyFlowConfig = { ...energyFlowConfig };
  if (cableConfig.radius !== undefined
    && resolvedEnergyFlowConfig.cableRadius === undefined) {
    resolvedEnergyFlowConfig.cableRadius = cableConfig.radius;
  }
  const energyFlow = createEnergyFlow({
    curve: cable.curve,
    config: resolvedEnergyFlowConfig,
  });
  const head = createPlasmaPulse({
    curve: cable.curve,
    accentColor,
    config: headConfig,
  });
  head.group.name = `${name}-writing-light`;
  group.add(cable.group, energyFlow.group, head.group);

  const setState = ({
    revealProgress = 0,
    signalProgress = revealProgress,
    retractProgress = 0,
    flowPhase = signalProgress * 1.15,
    pulseActive = signalProgress > 0.001 && retractProgress < 0.001,
    pulseOccludeCore = true,
    opacity = 1,
  } = {}) => {
    cable.setState({
      revealProgress,
      energizedProgress: signalProgress,
      retractProgress,
      opacity,
    });
    energyFlow.setState({
      energizedProgress: signalProgress,
      retractProgress,
      phase: flowPhase,
      opacity,
    });
    head.setState({
      progress: signalProgress,
      active: pulseActive,
      opacity,
      occludeCore: pulseOccludeCore,
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
      head.dispose();
      group.removeFromParent();
    },
  };
}
