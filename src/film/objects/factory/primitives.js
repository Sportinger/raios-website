import * as THREE from "three";

export function createResourceTracker() {
  const geometries = new Set();
  const materials = new Set();
  return {
    geometry(geometry) {
      geometries.add(geometry);
      return geometry;
    },
    material(material) {
      materials.add(material);
      return material;
    },
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      geometries.clear();
      materials.clear();
    },
  };
}

export function createFlatMaterial(tracker, color, options = {}) {
  return tracker.material(new THREE.MeshBasicMaterial({
    color,
    transparent: Boolean(options.transparent),
    opacity: options.opacity ?? 1,
    depthWrite: options.depthWrite ?? true,
    side: options.side ?? THREE.FrontSide,
  }));
}

export function createVectorBox(tracker, {
  size = [1, 1, 1],
  color,
  edgeColor,
  position = [0, 0, 0],
  opacity = 1,
} = {}) {
  const group = new THREE.Group();
  const geometry = tracker.geometry(new THREE.BoxGeometry(...size));
  const material = createFlatMaterial(tracker, color, {
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);
  if (edgeColor !== undefined) {
    const edgeGeometry = tracker.geometry(new THREE.EdgesGeometry(geometry));
    const edgeMaterial = tracker.material(new THREE.LineBasicMaterial({
      color: edgeColor,
      transparent: opacity < 1,
      opacity,
    }));
    group.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));
  }
  group.position.set(...position);
  return group;
}

export function createRoute(tracker, points, color, width = 0.08) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
  const geometry = tracker.geometry(new THREE.TubeGeometry(curve, 48, width, 6, false));
  const material = createFlatMaterial(tracker, color);
  return new THREE.Mesh(geometry, material);
}

export function createRing(tracker, radius, color, tube = 0.08) {
  const geometry = tracker.geometry(new THREE.TorusGeometry(radius, tube, 6, 48));
  const material = createFlatMaterial(tracker, color);
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = Math.PI / 2;
  return ring;
}
