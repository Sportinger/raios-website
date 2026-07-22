import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

const CONTROL_KEYS = new Set([
  "KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE", "ShiftLeft", "ShiftRight",
]);

export function createFpsCameraControls({
  camera,
  canvas,
  onChange,
  onLockChange,
  onSpeedChange,
}) {
  const controls = new PointerLockControls(camera, canvas);
  const direction = new THREE.Vector3();
  const movement = new THREE.Vector3();
  const pressed = new Set();
  let enabled = false;
  let speed = 5;

  const handleKeyDown = (event) => {
    if (!enabled || !CONTROL_KEYS.has(event.code)) return;
    event.preventDefault();
    pressed.add(event.code);
  };
  const handleKeyUp = (event) => pressed.delete(event.code);
  const handleCanvasClick = () => {
    if (enabled && !controls.isLocked) controls.lock();
  };
  const handleWheel = (event) => {
    if (!enabled || !controls.isLocked) return;
    event.preventDefault();
    speed = THREE.MathUtils.clamp(speed * (event.deltaY > 0 ? 0.88 : 1.12), 0.25, 40);
    onSpeedChange(speed);
  };
  const handlePointerChange = () => onChange();
  const handleLockChange = () => {
    if (!controls.isLocked) pressed.clear();
    onLockChange(controls.isLocked);
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  canvas.addEventListener("click", handleCanvasClick);
  canvas.addEventListener("wheel", handleWheel, { passive: false });
  controls.addEventListener("change", handlePointerChange);
  controls.addEventListener("lock", handleLockChange);
  controls.addEventListener("unlock", handleLockChange);

  return {
    dispose() {
      controls.unlock();
      controls.dispose();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("wheel", handleWheel);
    },

    getSpeed: () => speed,

    setEnabled(nextEnabled) {
      enabled = nextEnabled;
      pressed.clear();
      if (!enabled) controls.unlock();
    },

    update(deltaSeconds) {
      if (!enabled || !controls.isLocked || !pressed.size) return false;
      const multiplier = pressed.has("ShiftLeft") || pressed.has("ShiftRight") ? 3 : 1;
      const distance = speed * multiplier * deltaSeconds;
      movement.set(0, 0, 0);
      if (pressed.has("KeyW")) movement.z += 1;
      if (pressed.has("KeyS")) movement.z -= 1;
      if (pressed.has("KeyD")) movement.x += 1;
      if (pressed.has("KeyA")) movement.x -= 1;
      if (movement.lengthSq()) {
        movement.normalize();
        controls.moveForward(movement.z * distance);
        controls.moveRight(movement.x * distance);
      }
      if (pressed.has("KeyE")) camera.position.y += distance;
      if (pressed.has("KeyQ")) camera.position.y -= distance;
      camera.getWorldDirection(direction);
      onChange();
      return true;
    },
  };
}
