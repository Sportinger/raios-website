import * as THREE from "three";
import { smootherstep } from "../../../animation/progress.js";
import { disposeObject3D } from "../../../shared/dispose-object-3d.js";

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 glowColor;
  uniform float opacity;
  uniform float progress;
  varying vec2 vUv;

  void main() {
    vec2 offset = (vUv - vec2(0.80, 0.01)) * vec2(1.0, 0.70);
    float distanceFromContact = length(offset);
    float waveCenter = progress * 1.08;
    float wave = 1.0 - smoothstep(0.0, 0.115, abs(distanceFromContact - waveCenter));
    float poweredSurface = 1.0 - smoothstep(waveCenter - 0.32, waveCenter, distanceFromContact);
    float edgeFade = smoothstep(0.0, 0.08, progress) * (1.0 - smoothstep(0.92, 1.0, progress));
    float alpha = opacity * edgeFade * (wave * 0.46 + poweredSurface * 0.13);
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

export function createSurfaceCurrent({
  width,
  depth,
  height,
  color = 0x67d9ff,
}) {
  const group = new THREE.Group();
  group.name = "surface-current";
  group.position.y = height / 2 + 0.018;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(color) },
      opacity: { value: 0 },
      progress: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const wave = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  wave.rotation.x = -Math.PI / 2;
  wave.renderOrder = 8;
  group.add(wave);

  return {
    group,

    setState(progress, opacity = 1) {
      const current = smootherstep(progress);
      group.visible = current > 0.001 && current < 0.999;
      material.uniforms.progress.value = current;
      material.uniforms.opacity.value = opacity;
    },

    dispose() {
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
