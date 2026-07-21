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

Die rechte Kapitel-Navigation bildet die gesamte Story als vertikale Mini-Timeline ab und wird automatisch aus den Einträgen der `story-map.js` erzeugt. Kapitel `1` liegt bei `0 %` am oberen Rand; jede weitere Pill sitzt prozentual genau dort, wo ihr Kapitel innerhalb der gewichteten Scrollstrecke beginnt. Die halb sichtbaren nummerierten Pills markieren das aktive Kapitel, fahren bei Hover beziehungsweise Tastaturfokus aus dem Rand und springen beim Aktivieren zum Kapitelanfang. Neue Story-Einträge erhalten ohne zusätzliches HTML automatisch die nächste Nummer und Position. Bei reduzierter Bewegung wird das Kapitel ohne Scrollanimation direkt umgeschaltet.

Ein langes Kapitel kann über `navigationSections` eigene, lokal normierte Unterkapitel veröffentlichen. Die Story rechnet deren Start- und Endwerte automatisch in globale Scrollpositionen um. Die Boot-Sequenz nutzt dies für die sichtbaren Kapitel 2–9, bleibt intern aber ein einziger Objektgraph. Dadurch werden komplexe Features und große Labeltexturen nicht achtfach dupliziert.

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

Unter `mechanisms/` liegt mit `create-push-button.js` der erste allgemeine Mechanismus. Das Power-Button-Feature konfiguriert ihn, ohne dass der Mechanismus etwas über die Story oder den Einschaltvorgang wissen muss. Das allgemeine Kabel liegt gekapselt unter `objects/connections/cable/`; sein öffentlicher Import läuft nur über die dortige `index.js`.

Der Einschalt-Link ist bewusst aus mehreren Ebenen zusammengesetzt:

```text
features/power-link/                 Fachlicher Verbund
├── config.js                        Preset und Kompositionswerte
├── create-power-link.js             Einheitliche Zustands-API
└── index.js                         Öffentliche Exporte

objects/connections/cable/           Neutrale/progressiv aktivierte Leitung
objects/effects/energy-flow/         Bewegte Energieringe auf einer Kurve
objects/effects/plasma-pulse/        Plasma-Sprites und lokales Impulslicht
```

Alle drei allgemeinen Objekte nehmen ihre Form- und Materialwerte über `config` entgegen. Sie kennen weder den Power-Button noch das Kapitel. `features/power-link/` verbindet sie über dieselbe Kurve und stellt dem Kapitel nur `group`, `curve`, `setState()` und `dispose()` bereit. So kann ein anderes Feature ausschließlich das Kabel verwenden, Kabel plus Datenfluss anders kombinieren oder das komplette Power-Link-Preset übernehmen.

Ein wiederverwendbares Objekt:

- gibt eine `THREE.Group` heraus,
- besitzt eine semantische Zustands-API wie `setState({ openProgress })`,
- kennt keine Scrollposition und kein Kapitel,
- erzeugt bei `update()` keine neuen Geometrien oder Materialien und
- bietet `dispose()` an, sobald es eigene GPU-Ressourcen besitzt.

Wiederkehrende Bewegungslogik gehört unter `animation/`. Dort liegen reine Funktionen für Intervalle, Easing, Tracks und Transformationsschemata. Kapitel bestimmen das Timing; Objekte setzen den übergebenen Zustand um.

Die Abhängigkeitsrichtung bleibt immer:

```text
runtime + story → chapters → features → objects → animation/shared
```

Imports in die Gegenrichtung sind nicht erlaubt. Dadurch können Kabel, Türen oder Animationsschemata in mehreren Features verwendet werden, ohne diese Features miteinander zu koppeln.

### Power-on intern anpassen

Das Power-on-Kapitel enthält nur noch die Dramaturgie und setzt folgende Bausteine zusammen:

- `create-cable-route.js` definiert ausschließlich den räumlichen Verlauf dieses Kabels.
- `create-camera-choreography.js` besitzt Orbit, Flugpfad und Fokusübergang.
- `timeline.js` besitzt ausschließlich Zeitfenster und gemeinsame Zeitanker.
- `layout.js` besitzt ausschließlich feste Szenenpositionen und Abstände.
- `create-power-on-chapter.js` übersetzt den lokalen Kapitel-Fortschritt in Zustände der Features.

Am Ende des Kabel-Flugs löst `cameraRelease` den Kamerablick weich vom Impuls und führt sowohl Position als auch Blickziel exakt in die gemeinsame Home-Pose. Dadurch übernimmt die folgende Boot-Sequenz ohne Kamerasprung.

Für eine andere Route wird daher kein Kabel- oder Shader-Code geändert. Für ein anderes Kabelmaterial wird keine Kameralogik geändert. Ein neues Kapitel importiert Features immer aus deren `index.js`, niemals aus internen Erzeuger- oder Konfigurationsdateien.

### Boot-Sequenz

`features/boot-sequence/` komponiert die sichtbaren Phasen nach dem Einschaltimpuls. Die fachlichen Darsteller bleiben getrennt:

```text
features/
├── hardware-platform/   Bare Metal, CPU, RAM, Chipsatz, Controller und Geräte
├── uefi-firmware/       Firmware-Leiterbahnen und transparente UEFI-Ebene
├── boot-usb/            Mechanischer Stick, ESP und BOOTX64.EFI
├── limine-bridge/       Temporäre Boot-Brücke, Suche und Kernelpaket
├── kernel-platform/     Datenstrom, Aufbau, Landung und Laufpuls
├── boot-information/    Einmalige Übergabekarten
├── control-handoff/     Gerichtete UEFI-zu-raiOS-Tür
└── boot-sequence/       Deterministische Komposition aller Phasen
```

Die wiederverwendbaren Grundbausteine `objects/cards/` und `objects/effects/data-stream/` kennen diese Fachbegriffe nicht. Sprechertexte und Audio sind bewusst nicht Bestandteil der aktuellen Implementierung.

`chapters/boot-sequence/create-camera-choreography.js` definiert sieben fachliche Zwischenposen. Der allgemeine Camera-Rig verbindet daraus acht kontinuierliche Abschnitte von Home über Hardware, UEFI, USB, Limine, Kernel und Kontrollübergabe zurück nach Home. Die Kamera bewegt sich damit in jedem sichtbaren Boot-Kapitel und kann trotzdem ohne Sprung an Power-on und Kernel-Kapitel übergeben.

## Kapitel ergänzen

Ein Kapitel exportiert mindestens `id`, `group`, `update(progress)`, `resize(viewport)` und `dispose()`. Danach wird es in `story/story-map.js` mit einem Gewicht registriert. Prozentwerte eines Kapitels bleiben lokal und verändern keine späteren Kapitel.

Für Reduced Motion setzt die Runtime den Storyfortschritt auf den fertigen Zustand. Neue Kapitel und Objekte müssen deshalb für jeden Fortschrittswert deterministisch denselben Zustand darstellen.

### Aktuelle Story

1. `chapters/power-on/` richtet den Power-Button frontal zur Startkamera aus, drückt ihn automatisch und blendet ihn nach dem Einschalten aus.
2. Ein von Anfang an vollständig sichtbares, grau-metallisches Kabel beginnt mittig an der Rückseite des Buttons, läuft zunächst gerade aus dem Gehäuse, sinkt auf eine unsichtbare Bodenhöhe ab und schlängelt sich erst dort bis an die Seitenkante des weit entfernten `BARE METAL`-Layers. Eine kompakte organische Plasmawolke startet synchron mit dem Beginn des Button-Presses und seines blauen Power-Glows. Der Kern besteht vollständig aus einer dichten, unregelmäßigen Plasma-Sprite; eine schneidende 3D-Kerngeometrie wird nicht mehr verwendet. Direkt hinter dem Button und vor dem Ziel-Layer respektiert sie den Szenen-Depth-Test. Auf der freien Kabelstrecke rendert nur diese dichte Kernschicht vor dem Kabel und verdeckt es dadurch aus jedem Kamerawinkel ohne harte ovale Schnittkanten. Die äußeren Layer bleiben tiefengeprüft und lösen die Wolke über rotierende Plasmafilamente und einen kurzen Nachschweif weich auf. Ein zurückhaltendes mitwanderndes Punktlicht beleuchtet nur ihre unmittelbare Umgebung. Die einzige Kabeloberfläche mischt ein einziges Standardmaterial per Fragment-Shader entlang der Kabellänge weich von Grau auf elektrisch leuchtendes Blau; die wandernde Signalkante fadet dadurch kontinuierlich statt dreiecksweise zu springen, und es werden weiterhin keine übereinanderliegenden Kabelröhren gezeichnet. Schmale blaue Energieringe fließen anschließend in Impulsrichtung über den bereits aktivierten Abschnitt. Button und Layer liegen auf derselben Welt-Höhe; der Layer ist von Anfang an räumlich vorhanden und wird nicht eingeblendet.
3. Der Button bleibt während seiner Einführung räumlich vollständig statisch und von Anfang an opak; nur reales Licht macht ihn sichtbar. Eine unsichtbare neutralweiße Punktlichtquelle hält zunächst eindeutig hinter seiner Rückseite und orbitiert anschließend auf einer horizontalen 240-Grad-Kreisbahn im Uhrzeigersinn nach vorne. Das orbitierende Point Light erzeugt über eine `BasicShadowMap` bewusst harte wandernde Schatten. Das Power-Symbol verwendet zunächst ein graues `MeshStandardMaterial` und blendet in der zweiten Hälfte des Lichtorbits unabhängig auf raiOS-blaues Emissive ein. Eine schwache, mit Abstand über der Symbolfläche sitzende blaue Punktlichtquelle beleuchtet Kappe, Rand und nahe Objekte tatsächlich. Der größere Abstand verhindert den harten zentralen Lichtreflex; eine zweite additive Symbolkontur wird nicht mehr gezeichnet. Ab exakt diesem Zeitpunkt fahren Hemisphere- und Key-Light langsam per Smootherstep hinzu, sodass Gehäuse und Rand zunehmend lesbarer werden, ohne den wandernden Lichtakzent abrupt zu überdecken. Danach beginnt der Camera-Rig seinen vollständigen 90-Grad-Orbit um den Button. Gleich zu Beginn des Eindrückens starten der blaue Button-Power-Glow und die Plasmawolke gemeinsam. Während der Orbit positionsseitig ungekürzt weiterläuft, mischt sich der Kamerafokus langsam vom Button auf die Wolke. Am Orbit-Ende übernimmt die Flugbahn aus derselben Position und mit demselben Blickziel. Nach dem vollständig gedrückten Zustand fährt die Kappe weich in ihre Ruheposition zurück; Symbollicht, Emissive und Button-Underglow erlöschen synchron. Der Plasmakern bleibt anschließend als Kameraziel im Bildzentrum, während der Follow kontinuierlich an Höhe und Abstand gewinnt und auf die ursprüngliche Kameraseite zurückorbitiert.

Der schwarze Housing-Sockel besitzt nur ein Fünftel seiner ursprünglichen Tiefe. Der Kabel-Socket sitzt bündig an dieser flachen Rückseite.
4. `chapters/boot-sequence/` übernimmt anschließend als zusammenhängender Objektgraph und veröffentlicht acht navigierbare Abschnitte: Hardware wird auf `BARE METAL` schematisch sichtbar; UEFI breitet sich vom Firmware-Chip aus; der raiOS-USB-Stick dockt mechanisch an; Limine entsteht als kleine temporäre Brücke; `kernel.elf` strömt blockweise in den RAM; sechs Startinformationen docken am schwebenden Kernel an; die gerichtete Tür `UEFI → RAIOS` übergibt die Kontrolle; der fertige `RUST KERNEL · SURVIVAL CORE` landet schwer auf der Hardware.
5. `chapters/kernel/` setzt ohne erneuten Kernelaufbau fort und zeigt anschließend seine innere Unterteilung. Bare Metal und der abgedunkelte USB-Stick bleiben dabei räumlich vorhanden.

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
