import * as THREE from "three";
import { smootherstep } from "../../../animation/progress.js";
import { disposeObject3D } from "../../../shared/dispose-object-3d.js";
import {
  createPlasmaLayerSpecs,
  PLASMA_PULSE_DEFAULTS,
} from "./config.js";
import { createPlasmaGlowTexture } from "./create-plasma-glow-texture.js";

const CABLE_AXIS = new THREE.Vector3(0, 0, 1);

export function createPlasmaPulse({
  curve,
  accentColor = 0x69c7ff,
  config: overrides = {},
}) {
  const config = { ...PLASMA_PULSE_DEFAULTS, ...overrides };
  const group = new THREE.Group();
  group.name = "plasma-pulse";
  group.scale.setScalar(config.scale);
  const tangent = new THREE.Vector3();
  const texture = createPlasmaGlowTexture();
  const layerSpecs = overrides.layerSpecs
    ?? createPlasmaLayerSpecs(accentColor);

  const layers = layerSpecs.map((spec, index) => {
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: spec.color,
      blending: spec.blending === "normal"
        ? THREE.NormalBlending
        : THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      rotation: spec.rotation,
      transparent: true,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.name = `plasma-layer-${index + 1}`;
    sprite.position.fromArray(spec.position);
    sprite.scale.set(spec.scale[0], spec.scale[1], 1);
    sprite.renderOrder = 8 + index;
    group.add(sprite);
    return { material, spec, sprite };
  });
  const light = new THREE.PointLight(
    accentColor,
    0,
    config.lightDistance,
    config.lightDecay,
  );
  group.add(light);

  const setState = ({
    progress = 0,
    active = false,
    opacity = 1,
    occludeCore = true,
  } = {}) => {
    const easedProgress = smootherstep(progress);
    const envelope = active
      ? Math.min(1, Math.max(0, (1 - easedProgress) / config.fadeOutLength))
      : 0;
    curve.getPointAt(easedProgress, group.position);
    group.quaternion.setFromUnitVectors(
      CABLE_AXIS,
      curve.getTangentAt(easedProgress, tangent).normalize(),
    );
    group.visible = opacity > 0.001 && envelope > 0.001;
    layers[0].material.depthTest = occludeCore;
    layers.forEach(({ material, spec, sprite }, index) => {
      const turbulence = 1 + Math.sin(
        easedProgress * config.turbulenceFrequency + index * 1.7,
      ) * config.turbulenceAmount;
      material.opacity = opacity * envelope * spec.opacity;
      material.rotation = spec.rotation + easedProgress * spec.spin;
      sprite.scale.set(
        spec.scale[0] * turbulence,
        spec.scale[1] / turbulence,
        1,
      );
    });
    light.intensity = opacity * envelope * config.lightIntensity;
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
