import * as THREE from "three";
import { intervalProgress, smootherstep } from "../../animation/progress.js";
import { createScrollLayerStack } from "../../objects/layers/create-scroll-layer-stack.js";
import { createSectionedLayer } from "../../objects/layers/create-sectioned-layer.js";
import { createHorizontalLabel } from "../../objects/labels/create-horizontal-label.js";
import { disposeObject3D } from "../../shared/dispose-object-3d.js";
import { RUST_KERNEL_CONFIG } from "./config.js";
import { KERNEL_SECTIONS } from "./content.js";

export function createRustKernel() {
  const group = new THREE.Group();
  group.name = "rust-kernel";

  const base = createScrollLayerStack([RUST_KERNEL_CONFIG.layer], {
    baseY: RUST_KERNEL_CONFIG.baseY,
  });
  const sections = createSectionedLayer({
    ...RUST_KERNEL_CONFIG.layer,
    bottomY: base.layers[0].bottomY,
    sections: KERNEL_SECTIONS,
    columns: RUST_KERNEL_CONFIG.columns,
    rows: RUST_KERNEL_CONFIG.rows,
    gap: RUST_KERNEL_CONFIG.gap,
    mergedLabel: RUST_KERNEL_CONFIG.mergedLabel,
  });
  const survivalLabel = createHorizontalLabel(
    "RUST KERNEL · SURVIVAL CORE",
    "",
    RUST_KERNEL_CONFIG.layer.width * 0.86,
    RUST_KERNEL_CONFIG.layer.height / 0.7,
    {
      panel: false,
      titleFont: "900 300px ui-monospace, SFMono-Regular, Consolas, monospace",
      descriptionFont: "600 82px ui-monospace, SFMono-Regular, Consolas, monospace",
    },
  );
  survivalLabel.plane.position.set(
    0,
    RUST_KERNEL_CONFIG.baseY + RUST_KERNEL_CONFIG.layer.height / 2,
    RUST_KERNEL_CONFIG.layer.depth / 2 + 0.018,
  );
  survivalLabel.plane.rotation.x = 0;
  group.add(base.group, sections.group, survivalLabel.plane);

  return {
    group,

    setAssemblyProgress(progress) {
      base.render(progress);
    },

    setBreakdownProgress(progress) {
      const state = sections.render(progress);
      base.group.visible = !state.replacesBase;
      survivalLabel.material.opacity = 1 - smootherstep(intervalProgress(progress, 0.02, 0.14));
    },

    dispose() {
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
