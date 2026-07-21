import { createApp } from "./app/create-app.js";

let app = createApp({
  canvas: document.getElementById("layer-canvas"),
  stage: document.querySelector(".scroll-stage"),
});

const disposeApp = () => app.dispose();
window.addEventListener("pagehide", disposeApp, { once: true });

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener("pagehide", disposeApp);
    disposeApp();
  });
  import.meta.hot.accept();
}
