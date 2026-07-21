import * as THREE from "three";
import { smootherstep } from "../../../animation/progress.js";
import { disposeObject3D } from "../../../shared/dispose-object-3d.js";
import { ENERGY_FLOW_DEFAULTS } from "./config.js";

const CABLE_AXIS = new THREE.Vector3(0, 0, 1);

export function createEnergyFlow({ curve, config: overrides = {} }) {
  const config = { ...ENERGY_FLOW_DEFAULTS, ...overrides };
  const group = new THREE.Group();
  group.name = "energy-flow";
  const tangent = new THREE.Vector3();
  const geometry = new THREE.TorusGeometry(
    config.cableRadius + config.ringOffset,
    config.ringThickness,
    config.radialSegments,
    config.tubularSegments,
  );
  const material = new THREE.MeshBasicMaterial({
    color: config.color,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: config.opacity,
    transparent: true,
    toneMapped: false,
  });
  const dashes = Array.from({ length: config.count }, (_, index) => {
    const dash = new THREE.Mesh(geometry, material);
    dash.name = `energy-flow-dash-${index + 1}`;
    dash.renderOrder = 5;
    group.add(dash);
    return dash;
  });

  const setState = ({
    energizedProgress = 0,
    retractProgress = 0,
    phase = 0,
    opacity = 1,
  } = {}) => {
    const energized = smootherstep(energizedProgress);
    const retract = Math.min(smootherstep(retractProgress), energized);
    group.visible = opacity > 0.001 && energized > config.visibleAfter;
    material.opacity = opacity * config.opacity;
    dashes.forEach((dash, index) => {
      const dashProgress = (phase + index / config.count) % 1;
      dash.visible = group.visible
        && dashProgress >= retract
        && dashProgress < energized - config.signalHeadGap;
      if (!dash.visible) return;
      curve.getPointAt(dashProgress, dash.position);
      dash.quaternion.setFromUnitVectors(
        CABLE_AXIS,
        curve.getTangentAt(dashProgress, tangent).normalize(),
      );
    });
  };

  setState();

  return {
    group,
    setState,
    dispose() {
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
