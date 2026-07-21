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
      radius: 0.042,
      tubularSegments: 112,
      radialSegments: 10,
      signalFade: 0.09,
      idleColor: 0x263d4b,
      poweredColor: accentColor,
      poweredEmissiveStrength: 1.05,
      idleMetalness: 0.68,
      idleRoughness: 0.26,
      ...cableConfig,
    },
  });
  const energyFlow = createEnergyFlow({
    curve: cable.curve,
    config: {
      count: 11,
      cableRadius: cableConfig.radius ?? 0.042,
      ringOffset: 0.003,
      ringThickness: 0.008,
      color: 0xb8f2ff,
      opacity: 0.72,
      ...energyFlowConfig,
    },
  });
  const head = createPlasmaPulse({
    curve: cable.curve,
    accentColor,
    config: {
      scale: 0.13,
      fadeOutLength: 0.1,
      lightIntensity: 1.4,
      lightDistance: 1.15,
      turbulenceAmount: 0.05,
      ...headConfig,
    },
  });
  head.group.name = `${name}-writing-light`;
  group.add(cable.group, energyFlow.group, head.group);

  const setState = ({
    headProgress = 0,
    tailProgress = 0,
    flowPhase = headProgress * 1.15,
    opacity = 1,
  } = {}) => {
    cable.setState({
      revealProgress: headProgress,
      energizedProgress: headProgress,
      retractProgress: tailProgress,
      opacity,
    });
    energyFlow.setState({
      energizedProgress: headProgress,
      retractProgress: tailProgress,
      phase: flowPhase,
      opacity,
    });
    head.setState({
      progress: headProgress,
      active: headProgress > 0.001 && tailProgress < 0.001,
      opacity,
      occludeCore: true,
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
