import { disposeObject3D } from "../shared/dispose-object-3d.js";
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

const SCROLL_VIEWPORTS_PER_WEIGHT = 620;

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
  const camera = createCamera();
  const cameraRig = createCameraRig(camera);
  const world = createWorld();
  const story = createStory({
    scene: world.scene,
    context: { cameraRig, lightRig: world.lightRig },
  });
  const motionPreference = createMotionPreference();
  let reducedMotionProgress = 1;
  let chapterNavigation = null;
  const scrollDebug = createScrollDebug({
    container: scrollDebugContainer,
    items: story.navigationItems,
  });

  const renderAt = (progress) => {
    const storyProgress = motionPreference.matches ? reducedMotionProgress : progress;
    story.update(storyProgress);
    chapterNavigation?.setProgress(storyProgress);
    scrollDebug.setProgress(storyProgress);
    renderer.render(world.scene, camera);
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

  return {
    dispose() {
      unsubscribeMotion();
      chapterNavigation.dispose();
      scrollDebug.dispose();
      viewport.dispose();
      scrollDriver.dispose();
      story.dispose();
      disposeObject3D(world.environment);
      renderer.dispose();
    },
  };
}
