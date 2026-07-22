import * as THREE from "three";
import { evaluateCameraTrack } from "./camera-track.js";
import { createCameraDirectorStore } from "./camera-director-store.js";
import { openCameraDirectorWindow } from "./camera-director-window.js";
import { createFpsCameraControls } from "./fps-camera-controls.js";

const PLAYBACK_PROGRESS_PER_SECOND = 0.06;

export function createCameraDirector({
  camera,
  canvas,
  initialKeyframes,
  navigationItems,
  onEditingChange,
  onSeek,
}) {
  const store = createCameraDirectorStore(initialKeyframes);
  const listeners = new Set();
  const direction = new THREE.Vector3();
  const target = new THREE.Vector3();
  let popup = null;
  let currentPose = null;
  let focusDistance = 8;
  let storeSnapshot = store.getSnapshot();
  let state = {
    editing: false,
    fpsEnabled: false,
    playing: false,
    pointerLocked: false,
    progress: 0,
    speed: 5,
  };

  const hud = document.createElement("aside");
  hud.className = "camera-director-hud";
  hud.innerHTML = `
    <button class="camera-director-hud__button" type="button" data-director-open>DIRECTOR</button>
    <button class="camera-director-hud__button" type="button" data-director-fps aria-pressed="false">FPS</button>
    <output class="camera-director-hud__readout" data-director-readout>SCROLL 0.0000</output>
    <span class="camera-director-hud__hint" data-director-hint>Timeline in separatem Fenster</span>
    <span class="camera-director-crosshair" aria-hidden="true"></span>
  `;
  canvas.closest(".viewport")?.append(hud);
  const openButton = hud.querySelector("[data-director-open]");
  const fpsButton = hud.querySelector("[data-director-fps]");
  const readout = hud.querySelector("[data-director-readout]");
  const hint = hud.querySelector("[data-director-hint]");

  const captureCameraPose = () => {
    camera.getWorldDirection(direction);
    target.copy(camera.position).addScaledVector(direction, focusDistance);
    return {
      fov: camera.fov,
      position: camera.position.toArray(),
      target: target.toArray(),
      up: camera.up.toArray(),
    };
  };
  const setState = (patch) => {
    state = { ...state, ...patch };
    fpsButton.setAttribute("aria-pressed", String(state.fpsEnabled));
    readout.value = `SCROLL ${state.progress.toFixed(4)}`;
    hud.classList.toggle("camera-director-hud--locked", state.pointerLocked);
    hint.textContent = state.fpsEnabled
      ? state.pointerLocked
        ? `WASD · Q/E · ${state.speed.toFixed(1)} u/s · ESC`
        : "Canvas klicken, um Maus zu fangen"
      : state.editing
        ? "Camera Track aktiv"
        : "Timeline in separatem Fenster";
    listeners.forEach((listener) => listener({ ...state }));
  };
  const applyPose = (pose) => {
    if (!pose) return;
    camera.position.fromArray(pose.position);
    camera.up.fromArray(pose.up).normalize();
    camera.lookAt(target.fromArray(pose.target));
    if (Math.abs(camera.fov - pose.fov) > 0.0001) {
      camera.fov = pose.fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
  };
  const evaluateAt = (progress) => {
    const pose = evaluateCameraTrack(storeSnapshot.state.keyframes, progress);
    if (pose) {
      currentPose = pose;
      focusDistance = Math.max(
        0.1,
        new THREE.Vector3().fromArray(pose.position).distanceTo(
          new THREE.Vector3().fromArray(pose.target),
        ),
      );
    }
  };

  const fpsControls = createFpsCameraControls({
    camera,
    canvas,
    onChange: () => {
      currentPose = captureCameraPose();
    },
    onLockChange: (pointerLocked) => setState({ pointerLocked }),
    onSpeedChange: (speed) => setState({ speed }),
  });

  const controller = {
    apply(progress) {
      const progressChanged = Math.abs(progress - state.progress) > 0.00005;
      if (progressChanged) {
        if (state.editing && !state.fpsEnabled) evaluateAt(progress);
        setState({ progress });
      }
      if (state.editing) applyPose(currentPose);
    },

    capturePose() {
      return currentPose ? {
        fov: currentPose.fov,
        position: [...currentPose.position],
        target: [...currentPose.target],
        up: [...currentPose.up],
      } : captureCameraPose();
    },

    dispose() {
      popup?.close();
      unsubscribeStore();
      fpsControls.dispose();
      hud.remove();
      listeners.clear();
    },

    getState: () => ({ ...state }),

    openWindow() {
      if (popup && !popup.closed) {
        popup.focus();
        return;
      }
      popup = openCameraDirectorWindow({ controller, navigationItems, store });
    },

    seek(progress) {
      const nextProgress = THREE.MathUtils.clamp(Number(progress) || 0, 0, 1);
      if (!state.editing) controller.setEditing(true);
      if (!state.fpsEnabled) evaluateAt(nextProgress);
      setState({ progress: nextProgress });
      onSeek(nextProgress);
    },

    setEditing(editing) {
      if (editing === state.editing) return;
      if (editing) {
        currentPose = captureCameraPose();
        evaluateAt(state.progress);
      } else {
        controller.setFpsEnabled(false);
        currentPose = null;
      }
      setState({ editing, playing: editing ? state.playing : false });
      onEditingChange(editing);
    },

    setFpsEnabled(fpsEnabled) {
      if (fpsEnabled && !state.editing) controller.setEditing(true);
      fpsControls.setEnabled(fpsEnabled);
      setState({ fpsEnabled, playing: fpsEnabled ? false : state.playing });
    },

    setPlaying(playing) {
      if (playing && !state.editing) controller.setEditing(true);
      controller.setFpsEnabled(false);
      setState({ playing });
    },

    subscribe(listener) {
      listeners.add(listener);
      listener({ ...state });
      return () => listeners.delete(listener);
    },

    update(deltaSeconds) {
      if (state.fpsEnabled) fpsControls.update(deltaSeconds);
      if (!state.playing) return;
      const nextProgress = Math.min(1, state.progress + deltaSeconds * PLAYBACK_PROGRESS_PER_SECOND);
      controller.seek(nextProgress);
      if (nextProgress >= 1) setState({ playing: false });
    },
  };

  const unsubscribeStore = store.subscribe((snapshot) => {
    storeSnapshot = snapshot;
    if (state.editing && !state.fpsEnabled) {
      evaluateAt(state.progress);
      applyPose(currentPose);
    }
  });
  openButton.addEventListener("click", controller.openWindow);
  fpsButton.addEventListener("click", () => controller.setFpsEnabled(!state.fpsEnabled));

  return controller;
}
