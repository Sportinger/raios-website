import * as THREE from "three";
import { createScrollLayerStack } from "../../objects/layers/create-scroll-layer-stack.js";
import { createSectionedLayer } from "../../objects/layers/create-sectioned-layer.js";
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
  group.add(base.group, sections.group);

  return {
    group,

    setAssemblyProgress(progress) {
      base.render(progress);
    },

    setBreakdownProgress(progress) {
      const state = sections.render(progress);
      base.group.visible = !state.replacesBase;
    },

    dispose() {
      disposeObject3D(group);
      group.removeFromParent();
    },
  };
}
