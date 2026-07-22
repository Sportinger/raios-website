# raiOS · The Factory Moves In · Real 3D

Dieser Branch rekonstruiert den zweiminütigen 2,5D-Architekturfilm der raiOS-
Website als eigenständige, echte Three.js-Szene. Der Film auf `main` dient nur
als visuelle und zeitliche Referenz; UI-Lab-SVG, CSS und Produktionskomponenten
werden nicht kopiert.

## Ziel

Aus der festgelegten orthografischen Filmkamera soll der native 3D-Nachbau die
Komposition des Originals möglichst genau erhalten. Alle Decks, Maschinen,
Türen, Leitungen, Workpieces und App-Inseln besitzen jedoch echte räumliche
Tiefe. Dadurch kann später eine freie Orbit-Kamera ergänzt werden, ohne die
Filmfassung neu zu modellieren.

## Filmvertrag

- Dauer: `120` Sekunden
- Szenen: `14`
- Kamera-Keyframes: `18`
- Scrollstrecke: `1600svh` plus ein sichtbarer Viewport
- Autoplay: eine Filmsekunde pro realer Sekunde
- Finale: `21` echte, instanzierte App-Inseln
- Reduced Motion: deterministisches Poster bei Sekunde `118`

Die Zeitachse liegt in `src/film/film-data.js`. Jede Objektwelt besitzt nur eine
deterministische `setTime(time)`-API; vorwärts scrollen, rückwärts scrollen und
direktes Springen auf Kapitel erzeugen deshalb denselben Zustand.

## Architektur

```text
src/
├── main.js
├── animation/
│   └── progress.js
├── shared/
│   └── dispose-object-3d.js
└── film/
    ├── film-data.js
    ├── create-film-app.js
    ├── create-film-camera.js
    ├── create-film-world.js
    ├── presentation/       Original-Kamera, Voice-Captions und HUD-Daten
    └── objects/
        ├── foundation/     Kernel, Genesis, Agent, NET und Türen
        └── factory/        Builder, Shadow World, Guard und Archipelago
```

Die Foundation-Welt deckt die Sekunden `0–41` ab. Die Factory-Welt modelliert
die Sekunden `41–120`. Wiederholte Produktionspfade und das Insel-Finale nutzen
Konfiguration beziehungsweise `THREE.InstancedMesh` statt duplizierter Szenen.

## Kamera

Die SVG-Kamera des Referenzfilms war ein 2D-Pan/Zoom mit `scale`, `focusX` und
`focusY`. Der Nachbau übersetzt diese Werte auf eine echte orthografische Kamera
mit einer räumlichen isometrischen Blickrichtung. Referenzformat, Widescreen-
Korrektur, vertikaler Bias, die 18 Original-Keyframes und deren Smoothstep-
Interpolation bleiben erhalten. Eine freie Orbit-Steuerung ist bewusst noch
nicht Teil der Filmoberfläche.

Für gezielte Bildvergleiche kann eine Filmsekunde direkt geöffnet werden, zum
Beispiel `http://127.0.0.1:5174/?time=17`.

## Lokal starten

```powershell
npm install
npm run dev -- --port 5174
```

Danach ist der Film unter <http://127.0.0.1:5174/> erreichbar.

## Prüfen und bauen

```powershell
npm run check
npm run build
```

`npm run check` prüft Syntax, lokalen Modulgraph, Dead Code und den statischen
Produktions-Build. `pages-dist/` wird ausschließlich generiert und nicht
committed.
