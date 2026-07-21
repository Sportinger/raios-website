import * as THREE from "three";
import { KERNEL_SECTIONS } from "./kernel-content.js";
import { createSectionedLayer } from "./sectioned-layer.js";
import { createScrollLayerStack } from "./scroll-layer.js";

const canvas = document.getElementById("layer-canvas");
const stage = document.querySelector(".scroll-stage");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05070a, 0.045);

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(7.8, 6.4, 9.2);
camera.lookAt(0, -0.25, 0);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

scene.add(new THREE.HemisphereLight(0x8cc3ff, 0x020408, 1.15));

const keyLight = new THREE.DirectionalLight(0xb9d9ff, 3.8);
keyLight.position.set(4, 7, 6);
scene.add(keyLight);

function createStarField(count) {
  const positions = new Float32Array(count * 3);
  let seed = 0x5241494f;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * 28;
    positions[index * 3 + 1] = (random() - 0.25) * 18;
    positions[index * 3 + 2] = (random() - 0.5) * 24 - 4;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0x8cc3ff,
    size: 0.025,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: true,
  });
  return new THREE.Points(geometry, material);
}

scene.add(createStarField(170));

// Neue Ebenen werden nur hier ergänzt. Position und Scrollsegment berechnet
// createScrollLayerStack automatisch anhand der Reihenfolge und Höhe.
const KERNEL_LAYER = Object.freeze({
  width: 7.4,
  height: 0.72,
  depth: 5.2,
  color: 0x080d15,
  edgeColor: 0x38526f,
  outlineColor: 0x6d9dce,
  metalness: 0.42,
  roughness: 0.5,
});

const layerStack = createScrollLayerStack([KERNEL_LAYER], {
  baseY: -1.08,
});
scene.add(layerStack.group);

const kernelSections = createSectionedLayer({
  ...KERNEL_LAYER,
  bottomY: layerStack.layers[0].bottomY,
  sections: KERNEL_SECTIONS,
  columns: 3,
  rows: 2,
  gap: 0.22,
  mergedLabel: "RUST KERNEL",
});
scene.add(kernelSections.group);

function updateScrollTravel() {
  stage.style.minHeight = reducedMotion.matches
    ? "100svh"
    : `${100 + layerStack.layers.length * 620}vh`;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function intervalProgress(value, start, end) {
  return clamp((value - start) / Math.max(0.0001, end - start), 0, 1);
}

function scrollProgress() {
  const travel = Math.max(1, stage.offsetHeight - window.innerHeight);
  return clamp(window.scrollY / travel, 0, 1);
}

function renderAt(progress) {
  const effectiveProgress = reducedMotion.matches ? 1 : progress;
  layerStack.render(intervalProgress(effectiveProgress, 0, 0.24));
  const sectionState = kernelSections.render(intervalProgress(effectiveProgress, 0.24, 1));
  layerStack.group.visible = !sectionState.replacesBase;
  renderer.render(scene, camera);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  renderAt(scrollProgress());
}

let scrollFrame = 0;

function scheduleScrollRender() {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = 0;
    renderAt(scrollProgress());
  });
}

window.addEventListener("scroll", scheduleScrollRender, { passive: true });
window.addEventListener("resize", resize, { passive: true });
reducedMotion.addEventListener("change", () => {
  updateScrollTravel();
  renderAt(scrollProgress());
});

updateScrollTravel();
resize();
