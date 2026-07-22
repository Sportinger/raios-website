import * as THREE from "three";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

const OUTLINE_WIDTH = 0.045;

export function createResourceTracker() {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  return {
    geometry(geometry) {
      geometries.add(geometry);
      return geometry;
    },
    material(material) {
      materials.add(material);
      return material;
    },
    texture(texture) {
      textures.add(texture);
      return texture;
    },
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      geometries.clear();
      materials.clear();
      textures.clear();
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
    const sourceEdges = new THREE.EdgesGeometry(geometry);
    const edgeGeometry = tracker.geometry(new LineSegmentsGeometry().fromEdgesGeometry(sourceEdges));
    sourceEdges.dispose();
    const edgeMaterial = tracker.material(new LineMaterial({
      color: edgeColor,
      linewidth: OUTLINE_WIDTH,
      worldUnits: true,
      transparent: opacity < 1,
      opacity,
    }));
    group.add(new LineSegments2(edgeGeometry, edgeMaterial));
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

export function createPanelLabel(tracker, {
  width = 2.4,
  color,
  edgeColor,
  position = [0, 0, 0],
  bars = 3,
} = {}) {
  const group = new THREE.Group();
  group.name = "vector-label";
  group.add(createVectorBox(tracker, {
    size: [width, 0.42, 0.08],
    color,
    edgeColor,
  }));
  for (let index = 0; index < bars; index += 1) {
    const length = width * (0.18 + ((index * 7) % 5) * 0.075);
    group.add(createVectorBox(tracker, {
      size: [length, 0.055, 0.025],
      color: edgeColor,
      position: [-width * 0.34 + length / 2 + index * width * 0.19, 0, 0.058],
    }));
  }
  group.position.set(...position);
  return group;
}

export function createTextLabel(tracker, {
  text,
  width = 2.8,
  height = 0.58,
  color = 0xeaf7ff,
  background = 0x07111d,
  position = [0, 0, 0],
  fontSize = 48,
} = {}) {
  if (typeof document === "undefined") {
    return createPanelLabel(tracker, {
      width,
      color: background,
      edgeColor: color,
      position,
      bars: Math.max(2, Math.min(6, String(text).length % 7)),
    });
  }
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = `#${new THREE.Color(background).getHexString()}`;
  context.fillRect(0, 14, canvas.width, canvas.height - 28);
  context.strokeStyle = `#${new THREE.Color(color).getHexString()}`;
  context.lineWidth = 7;
  context.strokeRect(4, 18, canvas.width - 8, canvas.height - 36);
  context.fillStyle = `#${new THREE.Color(color).getHexString()}`;
  context.font = `800 ${fontSize}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(String(text), canvas.width / 2, canvas.height / 2, canvas.width - 70);
  const texture = tracker.texture(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const geometry = tracker.geometry(new THREE.PlaneGeometry(width, height));
  const material = tracker.material(new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }));
  const label = new THREE.Mesh(geometry, material);
  label.name = `label-${String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  label.position.set(...position);
  label.renderOrder = 20;
  return label;
}
