# raiOS Three.js Scroll Layers

Dieser Branch enthält ausschließlich das experimentelle Three.js-Scroll-Projekt der raiOS-Website. Die produktive Website liegt auf dem Branch [`main`](https://github.com/Sportinger/raios-website/tree/main).

Das Experiment ist eine statische Website aus HTML, CSS und nativen JavaScript-Modulen. Vite wird ausschließlich als Entwicklungsserver für Hot Module Replacement (HMR) verwendet; der Produktions-Build bleibt eine direkt auslieferbare statische Seite.

## Architektur

Die Anwendung trennt technische Laufzeit, Dramaturgie und fachliche 3D-Objekte voneinander:

```text
src/
├── main.js       Einstieg und HMR-Lifecycle
├── app/          Zusammensetzen und Aufräumen der Anwendung
├── runtime/      Renderer, Kamera, Welt, Viewport, Scroll und Motion Preference
├── story/        Reihenfolge, Gewichtung und Fortschritt der Kapitel
├── chapters/     Dramaturgie einzelner Erzählabschnitte
├── features/     Gekapselte fachliche 3D-Systeme und Darsteller
├── objects/      Kapitelübergreifend wiederverwendbare visuelle Bauteile
├── animation/    Wiederverwendbare Fortschritts-, Easing- und Animationsschemata
└── shared/       Technische Hilfsfunktionen ohne fachliche Abhängigkeiten
```

### Runtime

Nur Module unter `runtime/` greifen direkt auf Browserzustände wie Fenstergröße, Scrollposition und `prefers-reduced-motion` zu. Sie besitzen keine Kenntnis der Erzählung oder des Rust-Kernels.

### Story und Kapitel

`story/story-map.js` definiert Reihenfolge und relative Scrolllänge der Kapitel. Der Story-Controller übersetzt den globalen Scrollfortschritt in einen lokalen Wert zwischen `0` und `1` für jedes Kapitel.

Ein Kapitel entscheidet, wann etwas passiert. Es erstellt komplexe Features, fügt deren Gruppen in die Welt ein und steuert ausschließlich deren öffentliche API. Es greift nicht auf interne Meshes eines Features zu.

### Features

Ein Feature ist ein komplexer, fachlich abgegrenzter Darsteller. `features/rust-kernel/` besitzt beispielsweise Konfiguration, Inhalt, Aufbau und Lifecycle des Rust-Kernels. `features/power-button/` kombiniert den allgemeinen Druckknopf mit dem raiOS-Power-Symbol. Ein Feature kennt weder die Scrollposition noch die Position seines Kapitels in der Gesamtgeschichte.

Öffentliche Exporte eines Features laufen ausschließlich über dessen `index.js`. Interne Dateien werden von Kapiteln nicht direkt importiert. Wächst ein Feature, können eigene Unterordner wie `parts/`, `layout/`, `materials/` und `animations/` ergänzt werden.

### Wiederverwendbare Bauteile

Wiederkehrende visuelle Elemente gehören unter `objects/`, beispielsweise:

```text
objects/
├── environment/   Lichtaufbauten, Partikelfelder und Hintergründe
├── labels/        Labels und Texturen
├── layers/        Platten, Ebenen und Unterteilungen
├── connections/   Kabel, Leitungen, Ports und Datenflüsse
└── mechanisms/    Türen, Klappen, Schalter und Verriegelungen
```

Unter `mechanisms/` liegt mit `create-push-button.js` der erste allgemeine Mechanismus. Das Power-Button-Feature konfiguriert ihn, ohne dass der Mechanismus etwas über die Story oder den Einschaltvorgang wissen muss. `connections/create-cable.js` zeichnet eine beliebige räumliche Punktfolge als progressiv sichtbares Kabel und wird im Power-on-Kapitel für die Verbindung zum Bare-Metal-Layer eingesetzt.

Ein wiederverwendbares Objekt:

- gibt eine `THREE.Group` heraus,
- besitzt semantische Methoden wie `setOpenProgress()` oder `setFlowProgress()`,
- kennt keine Scrollposition und kein Kapitel,
- erzeugt bei `update()` keine neuen Geometrien oder Materialien und
- bietet `dispose()` an, sobald es eigene GPU-Ressourcen besitzt.

Wiederkehrende Bewegungslogik gehört unter `animation/`. Dort liegen reine Funktionen für Intervalle, Easing, Tracks und Transformationsschemata. Kapitel bestimmen das Timing; Objekte setzen den übergebenen Zustand um.

Die Abhängigkeitsrichtung bleibt immer:

```text
runtime + story → chapters → features → objects → animation/shared
```

Imports in die Gegenrichtung sind nicht erlaubt. Dadurch können Kabel, Türen oder Animationsschemata in mehreren Features verwendet werden, ohne diese Features miteinander zu koppeln.

## Kapitel ergänzen

Ein Kapitel exportiert mindestens `id`, `group`, `update(progress)`, `resize(viewport)` und `dispose()`. Danach wird es in `story/story-map.js` mit einem Gewicht registriert. Prozentwerte eines Kapitels bleiben lokal und verändern keine späteren Kapitel.

Für Reduced Motion setzt die Runtime den Storyfortschritt auf den fertigen Zustand. Neue Kapitel und Objekte müssen deshalb für jeden Fortschrittswert deterministisch denselben Zustand darstellen.

### Aktuelle Story

1. `chapters/power-on/` richtet den Power-Button frontal zur Startkamera aus, drückt ihn automatisch und blendet ihn nach dem Einschalten aus.
2. Ein elektrisch blau leuchtendes Kabel beginnt mittig an der Rückseite des Buttons, läuft zunächst gerade aus dem Gehäuse, sinkt auf eine unsichtbare Bodenhöhe ab und schlängelt sich erst dort bis an die Seitenkante des weit entfernten `BARE METAL`-Layers. Ein heller ON-Impuls mit additivem Halo läuft sichtbar durch das Kabel. Button und Layer liegen auf derselben Welt-Höhe; der Layer ist von Anfang an räumlich vorhanden und wird nicht eingeblendet.
3. Der Button bleibt während seiner Einführung räumlich vollständig statisch. Eine sichtbare neutralweiße Lichtquelle beginnt hinter ihm und orbitiert auf einer räumlichen 240-Grad-Bahn gegen den Uhrzeigersinn auf die Vorderseite. Ihr Point Light revealt dabei das zunächst fast schwarze, seitlich neutral graue Gehäuse. Noch während dieses Reveals umkreist der Camera-Rig den Button um 90 Grad nach rechts. Exakt beim vollständig gedrückten Zustand starten ON-Impuls und Kamera-Follow gemeinsam. Der Impulskern bleibt als exaktes Kameraziel im Bildzentrum, während der Follow zunächst kräftig beschleunigt, anschließend ruhiger wird, kontinuierlich an Höhe und Abstand gewinnt und auf die ursprüngliche Kameraseite zurückorbitiert.
4. `chapters/kernel/` übernimmt anschließend und zeigt den Aufbau sowie die Unterteilung des Rust-Kernels.

Die Zeitfenster und das räumliche Layout des Einschaltvorgangs liegen getrennt in `chapters/power-on/timeline.js` und `chapters/power-on/layout.js`. Form und Material des Buttons, Kabels und Layers gehören zu ihren Features beziehungsweise allgemeinen Objekten und enthalten keine Story-Zeitwerte.

## Lokal entwickeln mit HMR

Einmalig die Entwicklungsabhängigkeiten installieren:

```powershell
npm install
```

Danach den HMR-Devserver starten:

```powershell
npm run dev
```

Die Seite ist standardmäßig unter `http://localhost:5173/` erreichbar. Änderungen an CSS werden direkt übernommen. Bei Änderungen am Three.js-Modulgraph räumt `main.js` den bestehenden Objektgraphen, Listener und WebGL-Ressourcen auf und baut die Anwendung mit dem neuen Code erneut auf.

`vite.config.js` schließt den vollständig generierten Ordner `pages-dist/` vom Dateiwatcher aus. Dadurch kann der Produktions-Build parallel zum laufenden HMR-Server ausgeführt werden, ohne einen unnötigen Reload-Sturm auszulösen.

Der vorhandene Launcher verwendet ebenfalls den Vite-Devserver, sucht einen freien Port zwischen 8091 und 8100 und startet anschließend Codex:

```powershell
pwsh ./scripts/start-threejs-codex.ps1
```

## Produktions-Build

Alle JavaScript-Dateien prüfen:

```powershell
Get-ChildItem src -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
```

Anschließend immer den statischen Produktions-Build ausführen:

```powershell
pwsh ./scripts/build-pages-site.ps1
```

Der Build kopiert ausschließlich das Scroll-Projekt nach `pages-dist/` und prüft lokale Datei-Referenzen sowie die Cloudflare-Dateigrößenbegrenzung. `pages-dist/` enthält generierte Dateien und wird nicht committed.

## Lizenz

Siehe [LICENSE](LICENSE).
