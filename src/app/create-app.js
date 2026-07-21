import { createStory } from "../story/create-story.js";
import { createCamera } from "../runtime/create-camera.js";
import { createCameraRig } from "../runtime/create-camera-rig.js";
import { createMotionPreference } from "../runtime/create-motion-preference.js";
import { createRenderer } from "../runtime/create-renderer.js";
import { createScrollDriver } from "../runtime/create-scroll-driver.js";
import { createViewport } from "../runtime/create-viewport.js";
import { createWorld } from "../runtime/create-world.js";
import { createChapterNavigation } from "../ui/chapter-navigation/create-chapter-navigation.js";
import { createScrollDebug } from "../ui/scroll-debug/index.js";
import { intervalProgress, smootherstep } from "../animation/progress.js";

const SCROLL_VIEWPORTS_PER_WEIGHT = 620;
const BACKGROUND_REVEAL_START = 0.0281;
const BACKGROUND_REVEAL_END = 0.045;
const ENVIRONMENT_REVEAL_START = 0.0217;
const ENVIRONMENT_REVEAL_END = 0.0454;

export function createApp({
  canvas,
  chapterNavigation: navigationContainer,
  scrollDebug: scrollDebugContainer,
  stage,
}) {
  if (!canvas || !navigationContainer || !scrollDebugContainer || !stage) {
    throw new Error("The scroll canvas, stage, navigation, and debug output are required");
  }

  const renderer = createRenderer(canvas);
  const viewportElement = canvas.closest(".viewport");
  const camera = createCamera();
  const cameraRig = createCameraRig(camera);
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
  let animationTime = 0;
  let currentProgress = 0;
  const scrollDebug = createScrollDebug({
    container: scrollDebugContainer,
    items: story.navigationItems,
  });
  const renderScene = () => {
    story.prepareRender(renderer, world.scene, camera);
    renderer.render(world.scene, camera);
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
    story.update(storyProgress, motionPreference.matches ? 0 : animationTime);
    chapterNavigation?.setProgress(storyProgress);
    scrollDebug.setProgress(storyProgress);
    renderScene();
  };

  const scrollDriver = createScrollDriver({ stage, onProgress: renderAt });
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
    reducedMotionProgress = scrollDriver.getProgress();
    updateScrollTravel();
    renderAt(scrollDriver.getProgress());
  });

  updateScrollTravel();
  viewport.resize();

  const animate = (timestamp) => {
    animationStartedAt ??= timestamp;
    animationTime = (timestamp - animationStartedAt) / 1000;
    const storyProgress = motionPreference.matches
      ? reducedMotionProgress
      : currentProgress;
    story.update(storyProgress, motionPreference.matches ? 0 : animationTime);
    renderScene();
    animationFrame = window.requestAnimationFrame(animate);
  };
  animationFrame = window.requestAnimationFrame(animate);

  return {
    dispose() {
      window.cancelAnimationFrame(animationFrame);
      unsubscribeMotion();
      chapterNavigation.dispose();
      scrollDebug.dispose();
      viewport.dispose();
      scrollDriver.dispose();
      story.dispose();
      world.dispose();
      renderer.dispose();
    },
  };
}
