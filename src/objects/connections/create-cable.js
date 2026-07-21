import * as THREE from "three";
import { smootherstep } from "../../animation/progress.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";

function setGeometryProgress(geometry, progress) {
  const indexCount = geometry.index?.count || 0;
  const triangleCount = Math.floor((indexCount * progress) / 3);
  geometry.setDrawRange(0, triangleCount * 3);
}

export function createCable({ points, accentColor = 0x69c7ff }) {
  const group = new THREE.Group();
  group.name = "cable";
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");

  const sheathGeometry = new THREE.TubeGeometry(curve, 128, 0.075, 10, false);
  const sheathMaterial = new THREE.MeshStandardMaterial({
    color: 0x071019,
    metalness: 0.62,
    roughness: 0.34,
    transparent: true,
  });
  group.add(new THREE.Mesh(sheathGeometry, sheathMaterial));

  const signalGeometry = new THREE.TubeGeometry(curve, 128, 0.022, 8, false);
  const signalMaterial = new THREE.MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    toneMapped: false,
  });
  group.add(new THREE.Mesh(signalGeometry, signalMaterial));

  let opacity = 1;
  let reveal = 0;

  const render = () => {
    const easedReveal = smootherstep(reveal);
    group.visible = opacity > 0.001 && easedReveal > 0.001;
    sheathMaterial.opacity = opacity;
    signalMaterial.opacity = opacity * 0.9;
    setGeometryProgress(sheathGeometry, easedReveal);
    setGeometryProgress(signalGeometry, easedReveal);
  };

  return {
    group,

    setOpacity(value) {
      opacity = value;
      render();
    },

    setRevealProgress(value) {
      reveal = value;
      render();
    },

    dispose() {
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
