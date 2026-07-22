import * as THREE from "three";
import { intervalProgress } from "../animation/progress.js";
import { STORY_MAP } from "./story-map.js";

export function createStory({ scene, context }) {
  const totalWeight = STORY_MAP.reduce((total, entry) => total + entry.weight, 0);
  let weightCursor = 0;
  const chapters = STORY_MAP.map((entry, index) => {
    const chapter = entry.create(context);
    if (chapter.id !== entry.id) {
      throw new Error(`Chapter id mismatch: expected ${entry.id}, received ${chapter.id}`);
    }
    const start = weightCursor / totalWeight;
    weightCursor += entry.weight;
    const end = weightCursor / totalWeight;
    const root = new THREE.Group();
    root.name = `chapter:${entry.id}`;
    root.add(chapter.group);
    scene.add(root);
    return {
      chapter,
      end,
      index,
      isLast: index === STORY_MAP.length - 1,
      label: entry.label,
      root,
      start,
    };
  });
  let navigationIndex = 0;
  const navigationItems = chapters.flatMap(({ chapter, end, label, start }) => {
    const chapterLength = end - start;
    const sections = chapter.navigationSections ?? [{
      end: 1,
      id: chapter.id,
      label,
      start: 0,
    }];
    return sections.map((section) => Object.freeze({
      end: start + section.end * chapterLength,
      id: section.id,
      index: navigationIndex++,
      label: section.label,
      start: start + section.start * chapterLength,
    }));
  });
  const cameraKeyframes = chapters.flatMap(({ chapter, end, label, start }) => (
    chapter.cameraKeyframes ?? []
  ).map((keyframe) => ({
    label: `${label} · ${keyframe.label}`,
    progress: start + keyframe.progress * (end - start),
  }))).filter((keyframe, index, keyframes) => (
    index === 0 || Math.abs(keyframe.progress - keyframes[index - 1].progress) > 0.000001
  ));

  return {
    cameraKeyframes,
    navigationItems,
    totalWeight,

    prepareRender(renderer, scene, camera) {
      chapters.forEach(({ chapter, root }) => {
        if (root.visible) {
          chapter.prepareRender?.(renderer, scene, camera);
        }
      });
    },

    setUefiGlassOptics(settings) {
      chapters.forEach(({ chapter }) => {
        chapter.setUefiGlassOptics?.(settings);
      });
    },

    update(progress, animationTime = 0) {
      chapters.forEach(({ chapter, start, end, isLast, root }) => {
        const isActive = progress >= start && (progress < end || isLast);
        root.visible = isActive;
        if (isActive) {
          chapter.update(intervalProgress(progress, start, end), animationTime);
        }
      });
    },

    resize(viewport) {
      chapters.forEach(({ chapter }) => chapter.resize(viewport));
    },

    dispose() {
      chapters.forEach(({ chapter, root }) => {
        chapter.dispose();
        root.removeFromParent();
      });
    },
  };
}
