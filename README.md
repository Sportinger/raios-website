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
├── ui/           DOM-Oberflächen wie die Kapitel-Navigation
├── animation/    Wiederverwendbare Fortschritts-, Easing- und Animationsschemata
└── shared/       Technische Hilfsfunktionen ohne fachliche Abhängigkeiten
```

### Runtime

Nur Module unter `runtime/` greifen direkt auf Browserzustände wie Fenstergröße, Scrollposition und `prefers-reduced-motion` zu. Sie besitzen keine Kenntnis der Erzählung oder des Rust-Kernels.

### Story und Kapitel

`story/story-map.js` definiert Reihenfolge und relative Scrolllänge der Kapitel. Der Story-Controller übersetzt den globalen Scrollfortschritt in einen lokalen Wert zwischen `0` und `1` für jedes Kapitel.

Ein Kapitel entscheidet, wann etwas passiert. Es erstellt komplexe Features, fügt deren Gruppen in die Welt ein und steuert ausschließlich deren öffentliche API. Es greift nicht auf interne Meshes eines Features zu.

Die rechte Kapitel-Navigation wird automatisch aus den Einträgen der `story-map.js` erzeugt. Ihre halb sichtbaren nummerierten Pills markieren das aktive Kapitel, fahren bei Hover beziehungsweise Tastaturfokus aus dem Rand und springen beim Aktivieren zum Kapitelanfang. Neue Story-Einträge erhalten ohne zusätzliches HTML automatisch die nächste Nummer. Bei reduzierter Bewegung wird das Kapitel ohne Scrollanimation direkt umgeschaltet.

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
2. Ein von Anfang an vollständig sichtbares, grau-metallisches Kabel beginnt mittig an der Rückseite des Buttons, läuft zunächst gerade aus dem Gehäuse, sinkt auf eine unsichtbare Bodenhöhe ab und schlängelt sich erst dort bis an die Seitenkante des weit entfernten `BARE METAL`-Layers. Eine kompakte organische Plasmawolke startet synchron mit dem Beginn des Button-Presses und seines blauen Power-Glows. Der Kern besteht vollständig aus einer dichten, unregelmäßigen Plasma-Sprite; eine schneidende 3D-Kerngeometrie wird nicht mehr verwendet. Direkt hinter dem Button und vor dem Ziel-Layer respektiert sie den Szenen-Depth-Test. Auf der freien Kabelstrecke rendert nur diese dichte Kernschicht vor dem Kabel und verdeckt es dadurch aus jedem Kamerawinkel ohne harte ovale Schnittkanten. Die äußeren Layer bleiben tiefengeprüft und lösen die Wolke über rotierende Plasmafilamente und einen kurzen Nachschweif weich auf. Ein zurückhaltendes mitwanderndes Punktlicht beleuchtet nur ihre unmittelbare Umgebung. Die einzige Kabeloberfläche wechselt direkt dahinter von Grau zu elektrisch leuchtendem Blau; es werden keine übereinanderliegenden Kabelröhren mehr gezeichnet. Schmale blaue Energieringe fließen anschließend in Impulsrichtung über den bereits aktivierten Abschnitt. Button und Layer liegen auf derselben Welt-Höhe; der Layer ist von Anfang an räumlich vorhanden und wird nicht eingeblendet.
3. Der Button bleibt während seiner Einführung räumlich vollständig statisch und von Anfang an opak; nur reales Licht macht ihn sichtbar. Eine unsichtbare neutralweiße Punktlichtquelle hält zunächst eindeutig hinter seiner Rückseite und orbitiert anschließend auf einer horizontalen 240-Grad-Kreisbahn im Uhrzeigersinn nach vorne. Das orbitierende Point Light erzeugt über eine `BasicShadowMap` bewusst harte wandernde Schatten. Das Power-Symbol verwendet zunächst ein graues `MeshStandardMaterial` und blendet in der zweiten Hälfte des Lichtorbits unabhängig auf raiOS-blaues Emissive ein. Eine schwache, mit Abstand über der Symbolfläche sitzende blaue Punktlichtquelle beleuchtet Kappe, Rand und nahe Objekte tatsächlich. Der größere Abstand verhindert den harten zentralen Lichtreflex; eine zweite additive Symbolkontur wird nicht mehr gezeichnet. Ab exakt diesem Zeitpunkt fahren Hemisphere- und Key-Light langsam per Smootherstep hinzu, sodass Gehäuse und Rand zunehmend lesbarer werden, ohne den wandernden Lichtakzent abrupt zu überdecken. Danach beginnt der Camera-Rig seinen vollständigen 90-Grad-Orbit um den Button. Gleich zu Beginn des Eindrückens starten der blaue Button-Power-Glow und die Plasmawolke gemeinsam. Während der Orbit positionsseitig ungekürzt weiterläuft, mischt sich der Kamerafokus langsam vom Button auf die Wolke. Am Orbit-Ende übernimmt die Flugbahn aus derselben Position und mit demselben Blickziel. Nach dem vollständig gedrückten Zustand fährt die Kappe weich in ihre Ruheposition zurück; Symbollicht, Emissive und Button-Underglow erlöschen synchron. Der Plasmakern bleibt anschließend als Kameraziel im Bildzentrum, während der Follow kontinuierlich an Höhe und Abstand gewinnt und auf die ursprüngliche Kameraseite zurückorbitiert.

Der schwarze Housing-Sockel besitzt nur ein Fünftel seiner ursprünglichen Tiefe. Der Kabel-Socket sitzt bündig an dieser flachen Rückseite.
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
