const POPUP_NAME = "raios-camera-director";

const popupMarkup = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>raiOS Camera Director</title>
  <style>
    :root { color-scheme: dark; font-family: "SFMono-Regular", Consolas, monospace; background: #05090e; color: #dff5ff; }
    * { box-sizing: border-box; }
    body { margin: 0; min-width: 720px; overflow: hidden; background: radial-gradient(circle at 50% -20%, #153248, #05090e 48%); }
    button, input, select { font: inherit; }
    button, select, input[type="number"] { border: 1px solid #315269; border-radius: 6px; color: #dff5ff; background: #0b1721; }
    button { padding: 7px 10px; cursor: pointer; }
    button:hover, button:focus-visible, button[aria-pressed="true"] { border-color: #76d8ff; background: #14354b; outline: none; }
    button:disabled { opacity: .35; cursor: default; }
    .shell { display: grid; grid-template-rows: auto auto minmax(0, 1fr) auto; height: 100vh; overflow: hidden; }
    .bar { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-bottom: 1px solid #1c3444; background: rgba(5, 12, 18, .9); }
    .bar__title { margin-right: auto; color: #7bdcff; font-weight: 800; letter-spacing: .08em; }
    .readout { min-width: 78px; color: #8ee3ff; text-align: right; font-variant-numeric: tabular-nums; }
    .timeline-wrap { padding: 8px 10px 5px; border-bottom: 1px solid #1c3444; }
    .sections { position: relative; height: 20px; margin: 0 7px 2px; overflow: hidden; border-radius: 4px; background: #08131b; }
    .section { position: absolute; inset-block: 0; overflow: hidden; padding: 4px 5px; border-right: 1px solid #2b536b; color: #7598aa; font-size: 9px; white-space: nowrap; }
    .timeline { position: relative; height: 36px; }
    .timeline input { position: absolute; z-index: 1; inset: 0; width: 100%; margin: 0; accent-color: #65d4ff; }
    .markers { position: absolute; z-index: 2; inset: 0 7px; pointer-events: none; }
    .marker { position: absolute; top: 6px; width: 11px; min-width: 0; height: 22px; padding: 0; border-color: #65d4ff; border-radius: 2px 7px 7px 7px; background: #1486b8; transform: translateX(-50%) rotate(45deg); pointer-events: auto; }
    .marker[aria-current="true"] { background: #d9f7ff; box-shadow: 0 0 14px #5ad4ff; }
    .content { display: grid; grid-template-columns: 280px minmax(440px, 1fr); min-height: 0; overflow: hidden; }
    .list { overflow: auto; border-right: 1px solid #1c3444; }
    .keyframe { display: grid; grid-template-columns: 36px 1fr; gap: 3px 8px; width: 100%; padding: 8px 10px; border: 0; border-bottom: 1px solid #142936; border-radius: 0; text-align: left; }
    .keyframe strong { color: #76dcff; }
    .keyframe span { overflow: hidden; color: #7897a8; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
    .keyframe[aria-current="true"] { background: #123248; box-shadow: inset 3px 0 #66d7ff; }
    .empty { padding: 30px 16px; color: #6f8c9c; text-align: center; }
    .inspector { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; align-content: start; overflow: auto; padding: 10px; }
    fieldset { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 0; padding: 8px; border: 1px solid #244151; border-radius: 7px; }
    legend { padding: 0 6px; color: #76d9ff; font-size: 11px; letter-spacing: .08em; }
    label { display: grid; gap: 4px; color: #7897a8; font-size: 10px; }
    input[type="number"], select { width: 100%; padding: 5px 6px; }
    .wide { grid-column: 1 / -1; }
    .footer { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 10px; border-top: 1px solid #1c3444; background: #071018; }
    .status { margin-left: auto; align-self: center; color: #7190a1; font-size: 11px; }
    .danger { color: #ffafaf; }
  </style>
</head>
<body>
  <main class="shell">
    <header class="bar">
      <span class="bar__title">CAMERA DIRECTOR</span>
      <button data-action="edit">EDIT</button>
      <button data-action="fps">FPS</button>
      <button data-action="play">PLAY</button>
      <output class="readout" data-output="progress">0.0000</output>
    </header>
    <section class="timeline-wrap">
      <div class="sections" data-sections></div>
      <div class="timeline">
        <input data-timeline type="range" min="0" max="1" step="0.0001" value="0" aria-label="Scroll timeline">
        <div class="markers" data-markers></div>
      </div>
    </section>
    <section class="content">
      <div class="list" data-list></div>
      <form class="inspector" data-inspector>
        <fieldset>
          <legend>KEYFRAME</legend>
          <label class="wide">Progress<input name="progress" type="number" min="0" max="1" step="0.0001"></label>
          <label class="wide">Easing<select name="easing"><option value="smooth">Smooth</option><option value="linear">Linear</option></select></label>
        </fieldset>
        <fieldset>
          <legend>POSITION</legend>
          <label>X<input name="px" type="number" step="0.001"></label><label>Y<input name="py" type="number" step="0.001"></label><label>Z<input name="pz" type="number" step="0.001"></label>
        </fieldset>
        <fieldset>
          <legend>TARGET</legend>
          <label>X<input name="tx" type="number" step="0.001"></label><label>Y<input name="ty" type="number" step="0.001"></label><label>Z<input name="tz" type="number" step="0.001"></label>
        </fieldset>
        <fieldset>
          <legend>UP</legend>
          <label>X<input name="ux" type="number" step="0.001"></label><label>Y<input name="uy" type="number" step="0.001"></label><label>Z<input name="uz" type="number" step="0.001"></label>
        </fieldset>
        <fieldset>
          <legend>LENS</legend>
          <label class="wide">Field of view<input name="fov" type="number" min="1" max="160" step="0.1"></label>
        </fieldset>
      </form>
    </section>
    <footer class="footer">
      <button data-action="add">+ KEYFRAME</button>
      <button data-action="capture">UPDATE FROM CAMERA</button>
      <button class="danger" data-action="delete">DELETE</button>
      <button data-action="undo">UNDO</button>
      <button data-action="redo">REDO</button>
      <button data-action="story">STORY RESET</button>
      <button data-action="export">EXPORT</button>
      <button data-action="import">IMPORT</button>
      <input data-import type="file" accept="application/json,.json" hidden>
      <span class="status" data-status>WASD · Q/E · Shift · Mausrad</span>
    </footer>
  </main>
</body>
</html>`;

const formatTuple = (tuple) => tuple.map((value) => Number(value).toFixed(2)).join(" / ");
const setNumber = (form, name, value) => { form.elements[name].value = Number(value).toFixed(4); };

export function openCameraDirectorWindow({ controller, navigationItems, store }) {
  const popup = window.open("", POPUP_NAME, "popup,width=1040,height=720,resizable=yes");
  if (!popup) throw new Error("Das Camera-Director-Fenster wurde vom Browser blockiert.");
  popup.document.open();
  popup.document.write(popupMarkup);
  popup.document.close();

  const doc = popup.document;
  const timeline = doc.querySelector("[data-timeline]");
  const markers = doc.querySelector("[data-markers]");
  const list = doc.querySelector("[data-list]");
  const inspector = doc.querySelector("[data-inspector]");
  const progressOutput = doc.querySelector("[data-output='progress']");
  const status = doc.querySelector("[data-status]");
  const importInput = doc.querySelector("[data-import]");
  let snapshot = store.getSnapshot();
  let controllerState = controller.getState();

  const sections = doc.querySelector("[data-sections]");
  navigationItems.forEach((item) => {
    const section = doc.createElement("span");
    section.className = "section";
    section.style.left = `${item.start * 100}%`;
    section.style.width = `${Math.max(0.2, item.end - item.start) * 100}%`;
    section.textContent = item.label;
    section.title = `${item.label} · ${item.start.toFixed(4)}–${item.end.toFixed(4)}`;
    sections.append(section);
  });

  const render = () => {
    if (popup.closed) return;
    const { keyframes } = snapshot.state;
    const selected = keyframes.find(({ id }) => id === snapshot.selectedId) ?? null;
    timeline.value = controllerState.progress;
    progressOutput.value = controllerState.progress.toFixed(4);
    doc.querySelector("[data-action='edit']").setAttribute("aria-pressed", String(controllerState.editing));
    doc.querySelector("[data-action='fps']").setAttribute("aria-pressed", String(controllerState.fpsEnabled));
    doc.querySelector("[data-action='play']").setAttribute("aria-pressed", String(controllerState.playing));
    doc.querySelector("[data-action='play']").textContent = controllerState.playing ? "PAUSE" : "PLAY";
    doc.querySelector("[data-action='undo']").disabled = !snapshot.canUndo;
    doc.querySelector("[data-action='redo']").disabled = !snapshot.canRedo;
    doc.querySelector("[data-action='delete']").disabled = !selected;
    doc.querySelector("[data-action='capture']").disabled = !selected;
    status.textContent = controllerState.pointerLocked
      ? `FPS ${controllerState.speed.toFixed(1)} · ESC löst Maus`
      : "WASD · Q/E · Shift · Mausrad";

    markers.replaceChildren(...keyframes.map((keyframe) => {
      const marker = doc.createElement("button");
      marker.className = "marker";
      marker.style.left = `${keyframe.progress * 100}%`;
      marker.title = `Keyframe ${keyframe.progress.toFixed(4)}`;
      marker.setAttribute("aria-current", String(keyframe.id === snapshot.selectedId));
      marker.addEventListener("click", () => {
        store.select(keyframe.id);
        controller.seek(keyframe.progress);
      });
      return marker;
    }));

    list.replaceChildren();
    if (!keyframes.length) {
      const empty = doc.createElement("div");
      empty.className = "empty";
      empty.textContent = "Noch keine Keyframes. Positioniere die Kamera und klicke + KEYFRAME.";
      list.append(empty);
    } else {
      keyframes.forEach((keyframe, index) => {
        const button = doc.createElement("button");
        button.className = "keyframe";
        button.setAttribute("aria-current", String(keyframe.id === snapshot.selectedId));
        const number = doc.createElement("strong");
        const name = doc.createElement("span");
        const spacer = doc.createElement("span");
        const details = doc.createElement("span");
        number.textContent = String(index + 1).padStart(2, "0");
        name.textContent = keyframe.label;
        details.textContent = `${keyframe.progress.toFixed(4)} · ${formatTuple(keyframe.position)}`;
        button.append(number, name, spacer, details);
        button.addEventListener("click", () => {
          store.select(keyframe.id);
          controller.seek(keyframe.progress);
        });
        list.append(button);
      });
    }

    [...inspector.elements].forEach((element) => { element.disabled = !selected; });
    if (selected && doc.activeElement?.form !== inspector) {
      setNumber(inspector, "progress", selected.progress);
      inspector.elements.easing.value = selected.easing;
      ["px", "py", "pz"].forEach((name, index) => setNumber(inspector, name, selected.position[index]));
      ["tx", "ty", "tz"].forEach((name, index) => setNumber(inspector, name, selected.target[index]));
      ["ux", "uy", "uz"].forEach((name, index) => setNumber(inspector, name, selected.up[index]));
      setNumber(inspector, "fov", selected.fov);
    }
  };

  const captureCurrent = () => ({
    ...controller.capturePose(),
    easing: "smooth",
    progress: controller.getState().progress,
  });
  const updateFromForm = () => store.updateSelected({
    easing: inspector.elements.easing.value,
    fov: Number(inspector.elements.fov.value),
    position: ["px", "py", "pz"].map((name) => Number(inspector.elements[name].value)),
    progress: Number(inspector.elements.progress.value),
    target: ["tx", "ty", "tz"].map((name) => Number(inspector.elements[name].value)),
    up: ["ux", "uy", "uz"].map((name) => Number(inspector.elements[name].value)),
  });

  timeline.addEventListener("input", () => controller.seek(Number(timeline.value)));
  inspector.addEventListener("change", updateFromForm);
  doc.querySelector("[data-action='edit']").addEventListener("click", () => controller.setEditing(!controller.getState().editing));
  doc.querySelector("[data-action='fps']").addEventListener("click", () => controller.setFpsEnabled(!controller.getState().fpsEnabled));
  doc.querySelector("[data-action='play']").addEventListener("click", () => controller.setPlaying(!controller.getState().playing));
  doc.querySelector("[data-action='add']").addEventListener("click", () => store.addKeyframe(captureCurrent()));
  doc.querySelector("[data-action='capture']").addEventListener("click", () => store.updateSelected(captureCurrent()));
  doc.querySelector("[data-action='delete']").addEventListener("click", store.deleteSelected);
  doc.querySelector("[data-action='undo']").addEventListener("click", store.undo);
  doc.querySelector("[data-action='redo']").addEventListener("click", store.redo);
  doc.querySelector("[data-action='story']").addEventListener("click", store.resetToInitial);
  doc.querySelector("[data-action='export']").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(store.exportState(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = doc.createElement("a");
    anchor.href = url;
    anchor.download = "raios-camera-track.json";
    anchor.click();
    URL.revokeObjectURL(url);
  });
  doc.querySelector("[data-action='import']").addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", async () => {
    try {
      const file = importInput.files[0];
      if (file) store.importState(JSON.parse(await file.text()));
      status.textContent = "Import erfolgreich";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      importInput.value = "";
    }
  });
  doc.addEventListener("keydown", (event) => {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") return;
    event.preventDefault();
    if (event.shiftKey) store.redo(); else store.undo();
  });

  const unsubscribeStore = store.subscribe((nextSnapshot) => {
    snapshot = nextSnapshot;
    render();
  });
  const unsubscribeController = controller.subscribe((nextState) => {
    controllerState = nextState;
    render();
  });
  popup.addEventListener("beforeunload", () => {
    unsubscribeStore();
    unsubscribeController();
  }, { once: true });
  render();
  popup.focus();
  return popup;
}
