import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createStory } from "../story/create-story.js";
import { createCamera } from "../runtime/create-camera.js";
import { createCameraRig } from "../runtime/create-camera-rig.js";
import { createMotionPreference } from "../runtime/create-motion-preference.js";
import { createRenderer } from "../runtime/create-renderer.js";
import { createScrollDriver } from "../runtime/create-scroll-driver.js";
import { createViewport } from "../runtime/create-viewport.js";
import { createWorld } from "../runtime/create-world.js";
import { createChapterNavigation } from "../ui/chapter-navigation/create-chapter-navigation.js";
import { createGlassControls } from "../ui/glass-controls/index.js";
import { createPlaybackControls } from "../ui/playback-controls/index.js";
import { createScrollDebug } from "../ui/scroll-debug/index.js";
import { createCameraDirector } from "../dev/camera-director/index.js";
import { intervalProgress, smootherstep } from "../animation/progress.js";

const SCROLL_VIEWPORTS_PER_WEIGHT = 620;
const BACKGROUND_REVEAL_START = 0.0281;
const BACKGROUND_REVEAL_END = 0.045;
const ENVIRONMENT_REVEAL_START = 0.0217;
const ENVIRONMENT_REVEAL_END = 0.0454;
const AUTOPLAY_VIEWPORTS_PER_SECOND = 0.24;

export function createApp({
  canvas,
  chapterNavigation: navigationContainer,
  glassControls: glassControlsContainer,
  playbackControls: playbackControlsContainer,
  scrollDebug: scrollDebugContainer,
  stage,
}) {
  if (
    !canvas
    || !navigationContainer
    || !glassControlsContainer
    || !playbackControlsContainer
    || !scrollDebugContainer
    || !stage
  ) {
    throw new Error("The scroll canvas, stage, controls, navigation, and debug output are required");
  }

  const renderer = createRenderer(canvas);
  const viewportElement = canvas.closest(".viewport");
  const camera = createCamera();
  const cameraRig = createCameraRig(camera);
  const orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.enabled = false;
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.08;
  orbitControls.enablePan = false;
  orbitControls.minDistance = 1.5;
  orbitControls.maxDistance = 80;
  const world = createWorld(renderer);
  const story = createStory({
    scene: world.scene,
    context: { cameraRig, lightRig: world.lightRig },
  });
  const motionPreference = createMotionPreference();
  let reducedMotionProgress = 1;
  let chapterNavigation = null;
  let animationFrame = 0;
  let animationStartedAt = null;
  let previousAnimationTimestamp = null;
  let animationTime = 0;
  let autoplayPlaying = false;
  let orbitEnabled = false;
  let currentProgress = 0;
  let playbackControls = null;
  let cameraDirector = null;
  const scrollDebug = createScrollDebug({
    container: scrollDebugContainer,
    items: story.navigationItems,
  });
  const glassControls = createGlassControls({
    container: glassControlsContainer,
    onChange: ({
      backThickness,
      chromaticAberration,
      environmentRotation,
      frontThickness,
      ior,
      surfaceRandomness,
      surfaceVariation,
      tintHue,
      tintIntensity,
      transmissionBrightness,
    }) => {
      story.setUefiGlassOptics({
        backThickness,
        chromaticAberration,
        frontThickness,
        ior,
        surfaceRandomness,
        surfaceVariation,
        tintHue,
        tintIntensity,
        transmissionBrightness,
      });
      world.setEnvironmentRotation(environmentRotation);
    },
  });
  const renderScene = () => {
    story.prepareRender(renderer, world.scene, camera);
    renderer.render(world.scene, camera);
  };

  const orbitPosition = new THREE.Vector3();
  const orbitQuaternion = new THREE.Quaternion();
  const orbitUp = new THREE.Vector3();
  const viewDirection = new THREE.Vector3();
  const updateStory = (storyProgress, time) => {
    if (orbitEnabled) {
      orbitPosition.copy(camera.position);
      orbitQuaternion.copy(camera.quaternion);
      orbitUp.copy(camera.up);
    }
    story.update(storyProgress, time);
    if (orbitEnabled) {
      camera.position.copy(orbitPosition);
      camera.quaternion.copy(orbitQuaternion);
      camera.up.copy(orbitUp);
      camera.updateMatrixWorld();
    }
  };

  const renderAt = (progress) => {
    currentProgress = progress;
    const storyProgress = motionPreference.matches ? reducedMotionProgress : progress;
    const backgroundProgress = smootherstep(intervalProgress(
      storyProgress,
      BACKGROUND_REVEAL_START,
      BACKGROUND_REVEAL_END,
    ));
    const environmentProgress = smootherstep(intervalProgress(
      storyProgress,
      ENVIRONMENT_REVEAL_START,
      ENVIRONMENT_REVEAL_END,
    ));
    world.setBackgroundProgress(backgroundProgress);
    world.setEnvironmentProgress(environmentProgress);
    viewportElement?.style.setProperty(
      "--background-reveal",
      backgroundProgress.toFixed(4),
    );
    updateStory(storyProgress, motionPreference.matches ? 0 : animationTime);
    cameraDirector?.apply(storyProgress);
    chapterNavigation?.setProgress(storyProgress);
    scrollDebug.setProgress(storyProgress);
    renderScene();
  };

  const scrollDriver = createScrollDriver({ stage, onProgress: renderAt });
  const setAutoplayPlaying = (playing) => {
    if (motionPreference.matches || orbitEnabled) {
      autoplayPlaying = false;
    } else {
      if (playing && scrollDriver.getProgress() >= 0.9999) {
        scrollDriver.scrollToProgress(0, "auto");
      }
      autoplayPlaying = playing;
    }
    playbackControls?.setPlaying(autoplayPlaying);
  };
  const setOrbitEnabled = (enabled) => {
    if (enabled && cameraDirector?.getState().editing) {
      cameraDirector.setEditing(false);
    }
    orbitEnabled = enabled;
    orbitControls.enabled = enabled;
    if (enabled) {
      setAutoplayPlaying(false);
      camera.getWorldDirection(viewDirection);
      orbitControls.target.copy(camera.position).addScaledVector(viewDirection, 8);
      orbitControls.update();
    }
    playbackControls?.setOrbitEnabled(enabled);
    if (!enabled) renderAt(scrollDriver.getProgress());
  };
  playbackControls = createPlaybackControls({
    container: playbackControlsContainer,
    onOrbitToggle: setOrbitEnabled,
    onToggle: setAutoplayPlaying,
  });
  playbackControls.setDisabled(motionPreference.matches);
  const cameraDirectorEnabled = ["127.0.0.1", "::1", "localhost"].includes(
    window.location.hostname,
  ) || new URLSearchParams(window.location.search).get("camera-editor") === "1";
  if (cameraDirectorEnabled) {
    const initialKeyframes = story.cameraKeyframes.map(({ label, progress }) => {
      updateStory(progress, 0);
      return {
        ...cameraRig.getPose(),
        easing: "smooth",
        label,
        progress,
      };
    });
    cameraDirector = createCameraDirector({
      camera,
      canvas,
      initialKeyframes,
      navigationItems: story.navigationItems,
      onEditingChange: (editing) => {
        if (editing) {
          setAutoplayPlaying(false);
          setOrbitEnabled(false);
        } else {
          renderAt(scrollDriver.getProgress());
        }
      },
      onSeek: (progress) => {
        scrollDriver.scrollToProgress(progress, "auto");
        renderAt(progress);
      },
    });
  }
  chapterNavigation = createChapterNavigation({
    container: navigationContainer,
    items: story.navigationItems,
    onSelect: (item) => {
      if (motionPreference.matches) {
        reducedMotionProgress = item.start;
        renderAt(reducedMotionProgress);
        return;
      }
      scrollDriver.scrollToProgress(item.start, "smooth");
    },
  });
  const viewport = createViewport({
    camera,
    renderer,
    onResize: (viewportSize) => {
      story.resize(viewportSize);
      renderAt(scrollDriver.getProgress());
    },
  });

  const updateScrollTravel = () => {
    stage.style.minHeight = motionPreference.matches
      ? "100svh"
      : `${100 + story.totalWeight * SCROLL_VIEWPORTS_PER_WEIGHT}vh`;
  };

  const unsubscribeMotion = motionPreference.subscribe(() => {
    setAutoplayPlaying(false);
    playbackControls.setDisabled(motionPreference.matches);
    reducedMotionProgress = scrollDriver.getProgress();
    updateScrollTravel();
    renderAt(scrollDriver.getProgress());
  });

  updateScrollTravel();
  viewport.resize();

  const animate = (timestamp) => {
    animationStartedAt ??= timestamp;
    previousAnimationTimestamp ??= timestamp;
    const frameSeconds = Math.min(0.05, (timestamp - previousAnimationTimestamp) / 1000);
    previousAnimationTimestamp = timestamp;
    animationTime = (timestamp - animationStartedAt) / 1000;
    cameraDirector?.update(frameSeconds);
    if (autoplayPlaying) {
      const travelEnd = stage.offsetTop + stage.offsetHeight - window.innerHeight;
      const nextScrollY = Math.min(
        travelEnd,
        window.scrollY + window.innerHeight * AUTOPLAY_VIEWPORTS_PER_SECOND
          * frameSeconds,
      );
      window.scrollTo({ top: nextScrollY });
      if (nextScrollY >= travelEnd - 0.5) {
        setAutoplayPlaying(false);
      }
    }
    const storyProgress = motionPreference.matches
      ? reducedMotionProgress
      : currentProgress;
    updateStory(storyProgress, motionPreference.matches ? 0 : animationTime);
    if (orbitEnabled) orbitControls.update();
    cameraDirector?.apply(storyProgress);
    renderScene();
    animationFrame = window.requestAnimationFrame(animate);
  };
  animationFrame = window.requestAnimationFrame(animate);

  return {
    dispose() {
      window.cancelAnimationFrame(animationFrame);
      unsubscribeMotion();
      chapterNavigation.dispose();
      cameraDirector?.dispose();
      glassControls.dispose();
      playbackControls.dispose();
      orbitControls.dispose();
      scrollDebug.dispose();
      viewport.dispose();
      scrollDriver.dispose();
      story.dispose();
      world.dispose();
      renderer.dispose();
    },
  };
}
