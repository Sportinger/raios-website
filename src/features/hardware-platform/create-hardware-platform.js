import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createInfoCard } from "../../objects/cards/index.js";
import { createCircuitTrace } from "../../objects/connections/circuit-trace/index.js";
import { createDataStream } from "../../objects/effects/data-stream/index.js";
import { createBareMetalLayer } from "../bare-metal-layer/index.js";
import { HARDWARE_PLATFORM_CONFIG } from "./config.js";

function createTracePoints(source, target) {
  const midpoint = source.clone().lerp(target, 0.5);
  return [
    source,
    new THREE.Vector3(source.x, midpoint.y, midpoint.z),
    new THREE.Vector3(target.x, midpoint.y, midpoint.z),
    target,
  ];
}

export function createHardwarePlatform() {
  const group = new THREE.Group();
  group.name = "hardware-platform";
  const bareMetal = createBareMetalLayer();
  group.add(bareMetal.group);

  const components = new Map(HARDWARE_PLATFORM_CONFIG.components.map((definition) => {
    const [width, height, depth] = definition.size;
    const card = createInfoCard({
      title: definition.title,
      description: definition.description,
      width,
      height,
      depth,
      color: 0x0d141c,
      edgeColor: 0x57cfff,
    });
    card.group.position.set(
      definition.position[0],
      HARDWARE_PLATFORM_CONFIG.topY + definition.position[1],
      definition.position[2],
    );
    group.add(card.group);
    return [definition.id, { card, definition }];
  }));

  const tracePoint = (id) => {
    const { definition } = components.get(id);
    return new THREE.Vector3(
      definition.position[0],
      HARDWARE_PLATFORM_CONFIG.topY
        + definition.position[1]
        + definition.size[1] / 2
        + 0.035,
      definition.position[2],
    );
  };
  const firmwarePoints = createTracePoints(tracePoint("firmware"), tracePoint("cpu"));
  const firmwareTrace = createCircuitTrace({ points: firmwarePoints });
  const firmwareStream = createDataStream({
    points: firmwarePoints,
    count: 8,
    blockSize: [0.09, 0.045, 0.14],
    trailLength: 0.32,
  });
  group.add(firmwareTrace.group, firmwareStream.group);

  const buses = HARDWARE_PLATFORM_CONFIG.busConnections.map(([source, target]) => {
    const trace = createCircuitTrace({
      points: createTracePoints(tracePoint(source), tracePoint(target)),
      color: 0x3e9fc9,
    });
    group.add(trace.group);
    return trace;
  });
  const initializationLight = new THREE.PointLight(0x5bd2ff, 0, 3.4, 2);
  initializationLight.position.set(-1.15, 0.6, 0.15);
  group.add(initializationLight);

  const setState = ({
    hardwareProgress = 0,
    initializationProgress = 0,
    usbProgress = 0,
    opacity = 1,
  } = {}) => {
    const timing = HARDWARE_PLATFORM_CONFIG.timing;
    const silhouettes = intervalProgress(hardwareProgress, ...timing.silhouettes);
    const surfacePower = intervalProgress(hardwareProgress, ...timing.surfacePower);
    const cpuAndFirmware = intervalProgress(
      initializationProgress,
      ...timing.cpuAndFirmware,
    );
    const firmwareExecution = intervalProgress(
      initializationProgress,
      ...timing.firmwareExecution,
    );
    const chipset = intervalProgress(initializationProgress, ...timing.chipset);
    const ram = intervalProgress(initializationProgress, ...timing.ram);
    const memoryTraining = intervalProgress(
      initializationProgress,
      ...timing.memoryTraining,
    );
    const busProgress = intervalProgress(initializationProgress, ...timing.buses);
    const usbController = intervalProgress(
      initializationProgress,
      ...timing.usbController,
    );
    const usbRead = intervalProgress(usbProgress, ...timing.usbRead);
    const memoryPulse = Math.sin(memoryTraining * Math.PI * 6)
      * Math.sin(memoryTraining * Math.PI);
    const usbPulse = Math.sin(usbRead * Math.PI);
    const activation = {
      cpu: cpuAndFirmware,
      firmware: cpuAndFirmware,
      chipset,
      ram,
      usb: usbController,
      devices: 0,
    };

    bareMetal.setState({
      revealProgress: 1,
      opacity,
      elevationProgress: 1,
      currentProgress: surfacePower,
    });
    components.forEach(({ card }, id) => {
      card.setState({
        progress: silhouettes,
        activationProgress: activation[id],
        pulseProgress: id === "ram"
          ? Math.max(0, memoryPulse)
          : id === "usb" ? usbPulse : 0,
        opacity,
      });
    });
    firmwareTrace.setState({
      progress: firmwareExecution,
      pulse: Math.sin(firmwareExecution * Math.PI),
      opacity,
    });
    firmwareStream.setState({ progress: firmwareExecution, opacity });
    buses.forEach((bus, index) => bus.setState({
      progress: intervalProgress(busProgress, index * 0.08, 0.7 + index * 0.08),
      opacity: opacity * 0.72,
      pulse: usbPulse,
    }));
    initializationLight.intensity = smootherstep(cpuAndFirmware)
      * (1 - smootherstep(intervalProgress(initializationProgress, 0.9, 1)))
      * 1.45;
  };
  setState();

  return {
    group,
    setState,
    dispose() {
      bareMetal.dispose();
      components.forEach(({ card }) => card.dispose());
      firmwareTrace.dispose();
      firmwareStream.dispose();
      buses.forEach((bus) => bus.dispose());
      group.removeFromParent();
    },
  };
}
