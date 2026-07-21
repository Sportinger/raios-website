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

Die App besitzt zusätzlich einen zentralen `requestAnimationFrame`-Tick. Er gibt
den aktiven Kapiteln eine fortlaufende Animationszeit, während der Scrollwert
weiterhin ausschließlich den dramaturgischen Zustand bestimmt. So können
laufende Energieeffekte auch ohne Scrollereignis weiterfließen. Bei
`prefers-reduced-motion` wird die Animationszeit auf null gesetzt.

Der Hintergrund besitzt einen eigenen globalen Reveal und ist nicht an ein
Kapitel-Keyframe gekoppelt. Bis `SCROLL 0.0281` bleiben CSS-Hintergrund und
Sternfeld vollständig schwarz beziehungsweise unsichtbar. Zwischen `0.0281`
und `0.0450` blenden beide gemeinsam per Smootherstep auf den normalen
dunkelblauen Radialhintergrund ein. Szenenlichter bleiben davon unabhängig.

### Story und Kapitel

`story/story-map.js` definiert Reihenfolge und relative Scrolllänge der Kapitel. Der Story-Controller übersetzt den globalen Scrollfortschritt in einen lokalen Wert zwischen `0` und `1` für jedes Kapitel.

Ein Kapitel entscheidet, wann etwas passiert. Es erstellt komplexe Features, fügt deren Gruppen in die Welt ein und steuert ausschließlich deren öffentliche API. Es greift nicht auf interne Meshes eines Features zu.

Die rechte Kapitel-Navigation bildet die gesamte Story als vertikale Mini-Timeline ab und wird automatisch aus den Einträgen der `story-map.js` erzeugt. Kapitel `1` liegt bei `0 %` am oberen Rand; jede weitere Pill sitzt prozentual genau dort, wo ihr Kapitel innerhalb der gewichteten Scrollstrecke beginnt. Die halb sichtbaren nummerierten Pills markieren das aktive Kapitel, fahren bei Hover beziehungsweise Tastaturfokus aus dem Rand und springen beim Aktivieren zum Kapitelanfang. Neue Story-Einträge erhalten ohne zusätzliches HTML automatisch die nächste Nummer und Position. Bei reduzierter Bewegung wird das Kapitel ohne Scrollanimation direkt umgeschaltet.

Ein langes Kapitel kann über `navigationSections` eigene, lokal normierte Unterkapitel veröffentlichen. Die Story rechnet deren Start- und Endwerte automatisch in globale Scrollpositionen um. Die Boot-Sequenz nutzt dies für sechs sichtbare Unterkapitel, bleibt intern aber ein einziger Objektgraph. Diese Navigationsanker sind reine inhaltliche Metadaten: Sie schneiden weder die Kamerafahrt noch eine andere Animation in einzelne Clips. Ihre Positionen können daher frei verschoben werden, ohne an der Kapitelgrenze einen Kamerastopp zu erzeugen. Dadurch werden komplexe Features und große Labeltexturen nicht mehrfach dupliziert.

Die Debug-Anzeige links oben nennt den globalen `SCROLL`-Fortschritt und den lokalen Fortschritt des aktiven sichtbaren `KAPITEL`-Abschnitts jeweils mit vier Nachkommastellen. Damit lassen sich Timing-Korrekturen eindeutig benennen, ohne Werte aus der Scrollposition schätzen zu müssen.

### Features

Ein Feature ist ein komplexer, fachlich abgegrenzter Darsteller. `features/uefi-firmware/` besitzt beispielsweise Konfiguration, Inhalt, Aufbau und Lifecycle der UEFI-Umgebung. `features/power-button/` kombiniert den allgemeinen Druckknopf mit dem raiOS-Power-Symbol. Ein Feature kennt weder die Scrollposition noch die Position seines Kapitels in der Gesamtgeschichte.

Öffentliche Exporte eines Features laufen ausschließlich über dessen `index.js`. Interne Dateien werden von Kapiteln nicht direkt importiert. Wächst ein Feature, können eigene Unterordner wie `parts/`, `layout/`, `materials/` und `animations/` ergänzt werden.

### Wiederverwendbare Bauteile

Wiederkehrende visuelle Elemente gehören unter `objects/`, beispielsweise:

```text
objects/
├── environment/   Lichtaufbauten, Partikelfelder und Hintergründe
├── labels/        Labels und Texturen
├── layers/        Platten, Ebenen, gemeinsame Größen und Entfaltungslogik
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
objects/connections/transient-signal-cable/ Kabel + Lichtkopf + Einzug
objects/effects/energy-flow/         Bewegte Energieringe auf einer Kurve
objects/effects/plasma-pulse/        Plasma-Sprites und lokales Impulslicht
```

Alle drei allgemeinen Objekte nehmen ihre Form- und Materialwerte über `config` entgegen. Sie kennen weder den Power-Button noch das Kapitel. `objects/connections/transient-signal-cable/` komponiert sie einmalig auf derselben Kurve; Power-Link und UEFI konfigurieren nur noch unterschiedliche Looks, Routen und semantische Zustände. `features/power-link/` stellt dem Kapitel weiterhin ausschließlich `group`, `curve`, `setState()` und `dispose()` bereit.

Ein wiederverwendbares Objekt:

- gibt eine `THREE.Group` heraus,
- besitzt eine semantische Zustands-API wie `setState({ openProgress })`,
- kennt keine Scrollposition und kein Kapitel,
- erzeugt bei `update()` keine neuen Geometrien oder Materialien und
- bietet `dispose()` an, sobald es eigene GPU-Ressourcen besitzt.

UEFI, Limine und Rust-Kernel verwenden gemeinsam `objects/layers/expanding-stage-layer/`. Dieses
Objekt kapselt Geometrie, Kanten, Seitentitel sowie Aufsteigen, Expansion und
Rückzug. Eine zustandsbasierte `surfaceOpacityScale` erlaubt zusätzlich eine
langsame Verdichtung nach der Entfaltung. Die Features liefern nur Quelle,
Zielhöhe, Material und eigene Inhalte.
`objects/layers/system-layer-preset.js` hält zusätzlich die identischen Maße von
Bare Metal, UEFI, Limine und Rust-Kernel fest. Dadurch bleiben alle vollständigen
Schichten deckungsgleich, ohne dieselben Zahlen oder Transformationsabläufe in
mehreren Features zu duplizieren.

Die Entstehungsorte werden nicht mehrfach als Koordinaten gepflegt. Jede
Quellkomponente veröffentlicht einen unveränderlichen Layer-Anchor aus Position
und Größe; die Boot-Komposition reicht ihn an die nächste Stufe weiter:

```text
SPI Flash → UEFI → Boot Manager → Limine → Kernel Loader → Rust Kernel
```

Ändert sich ein Chipmaß oder eine Position, wächst die abhängige Schicht damit
automatisch aus dem neuen Footprint.

Transparente Softwareschichten schreiben bewusst Tiefe und besitzen eine feste
Renderreihenfolge. So werden Verbindungen hinter einer Schicht von deren Farbe
und Deckkraft beeinflusst, während räumlich davorliegende Kabelteile sichtbar
bleiben. UEFI endet nahezu blickdicht bei `0.9`; Limine und Kernel verwenden
eigene dunklere Transparenzwerte, damit der Schichtstapel unterscheidbar bleibt.

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

Nach dem Orbit bewegt sich die Kamera nur noch auf einer kurzen, weit außen liegenden Strecke und kommt dem Impuls nicht aggressiv näher. `cameraRelease` beginnt bereits bei `0.36`, reduziert den Blickanteil des Impulses während dieser Fahrt kontinuierlich und hat ihn bis `0.57` praktisch vollständig zugunsten der Bare-Metal-Platte freigegeben. Ab `0.505` übernimmt eine eigene Slow-Drift-Phase: Die Kamerahöhe bleibt konstant und der räumliche Weg bis `0.82` ist bewusst sehr kurz. Kurz vor dem sichtbaren Kontakt beginnen sowohl das Hochfahren der Platte als auch die weiche cyanfarbene Energiewelle des wiederverwendbaren `surface-current`-Objekts. Ab `0.79` formt sich außerdem derselbe mittige SPI-Flash heraus, den die Boot-Sequenz anschließend weiterverwendet. Ab `0.82` fährt die Kamera kontinuierlich in eine schräge Boot-Übersicht; eine Draufsicht findet am Ende von Kapitel 1 und während der sichtbaren Kapitel 2–4 ausdrücklich nicht statt. Diese Perspektive übernimmt die Boot-Sequenz ohne Sprung.

Für eine andere Route wird daher kein Kabel- oder Shader-Code geändert. Für ein anderes Kabelmaterial wird keine Kameralogik geändert. Ein neues Kapitel importiert Features immer aus deren `index.js`, niemals aus internen Erzeuger- oder Konfigurationsdateien.

### Boot-Sequenz

`features/boot-sequence/` komponiert die sichtbaren Phasen nach dem Einschaltimpuls. Die fachlichen Darsteller bleiben getrennt:

```text
features/
├── hardware-platform/   Bare Metal, mittiger SPI-Flash und eingelassener USB-Port
├── uefi-firmware/       UEFI-Bootumgebung, Boot Manager und USB Boot Service
├── boot-usb/            Mechanischer Stick, Einstecken und Leseaktivität
├── limine-stage/        Temporäre Vollschicht mit Config und Loader
├── kernel-platform/     Einzellayer, Aufbau, Landung und Laufpuls
└── boot-sequence/       Deterministische Komposition aller Phasen
```

Die wiederverwendbaren Grundbausteine `objects/cards/`, `objects/connections/cable/`, `objects/connections/transient-signal-cable/`, `objects/effects/energy-flow/` und `objects/effects/plasma-pulse/` kennen diese Fachbegriffe nicht. `createInfoCard()` kapselt zusätzlich den gemeinsamen Chip-Aufbau: Zuerst wird nur der flache Footprint auf der Trägerschicht umrissen, danach wächst die Geometrie bodenverankert nach oben und zuletzt erscheint das unverzerrte Label. SPI, UEFI und Limine bauen dafür keine eigenen Positionsanimationen. Power-on und beide UEFI-Pfade verwenden dieselbe Signalkabel-Komposition aus Kabel, Energieringen und Lichtkopf; nur Presets und Routen liegen in ihren Features. Das erste UEFI-Kabel beginnt innerhalb des Sticks, läuft kurz durch Bare Metal, steigt über enge abgerundete Ecken nach oben und dockt seitlich an USB Boot an. Das zweite verbindet USB Boot mit dem symmetrisch gegenüberliegenden Boot Manager. Die Lichtköpfe laufen nacheinander durch beide Kabel, die anschließend vollständig verlegt und blau bestehen bleiben. Danach steigt Limine direkt aus dessen veröffentlichtem Anchor und expandiert wie UEFI erst auf Zielhöhe. Auf der fertigen Schicht stehen ausschließlich `CONFIG` und `KERNEL LOADER`; zwischen beiden läuft der einzige interne Signalpfad. Sprechertexte und Audio sind bewusst nicht Bestandteil der aktuellen Implementierung.

`chapters/boot-sequence/create-camera-choreography.js` enthält den 70-Grad-UEFI-Reveal-Orbit gegen den Uhrzeigersinn und anschließend den 80-Grad-Rückorbit im Uhrzeigersinn auf die USB-Seite. Alle Werte sind lokal zum Boot-Kapitel definiert und bleiben deshalb von späteren Änderungen der Story-Gewichte unberührt. Danach läuft die Kamera nur noch wenige Zentimeter weich in ihre gespeicherte Endpose aus. Alle späteren Kamera-Keyframes wurden entfernt; Limine, Kernel, Handoff und Landung laufen mit unveränderter Kamera.

## Kapitel ergänzen

Ein Kapitel exportiert mindestens `id`, `group`, `update(progress)`, `resize(viewport)` und `dispose()`. Danach wird es in `story/story-map.js` mit einem Gewicht registriert. Prozentwerte eines Kapitels bleiben lokal und verändern keine späteren Kapitel.

Für Reduced Motion setzt die Runtime den Storyfortschritt auf den fertigen Zustand. Neue Kapitel und Objekte müssen deshalb für jeden Fortschrittswert deterministisch denselben Zustand darstellen.

### Aktuelle Story

1. `chapters/power-on/` richtet den Power-Button frontal zur Startkamera aus, drückt ihn automatisch und lässt ihn anschließend wieder in seine mechanische Ruheposition fahren.
2. Ein von Anfang an vollständig sichtbares, grau-metallisches Kabel beginnt mittig an der Rückseite des Buttons, läuft zunächst gerade aus dem Gehäuse, sinkt auf eine unsichtbare Bodenhöhe ab und schlängelt sich erst dort bis an die Seitenkante des weit entfernten `BARE METAL`-Layers. Eine kompakte organische Plasmawolke startet synchron mit dem Beginn des Button-Presses und seines blauen Power-Glows. Der Kern besteht vollständig aus einer dichten, unregelmäßigen Plasma-Sprite; eine schneidende 3D-Kerngeometrie wird nicht mehr verwendet. Direkt hinter dem Button und vor dem Ziel-Layer respektiert sie den Szenen-Depth-Test. Auf der freien Kabelstrecke rendert nur diese dichte Kernschicht vor dem Kabel und verdeckt es dadurch aus jedem Kamerawinkel ohne harte ovale Schnittkanten. Die äußeren Layer bleiben tiefengeprüft und lösen die Wolke über rotierende Plasmafilamente und einen kurzen Nachschweif weich auf. Ein zurückhaltendes mitwanderndes Punktlicht beleuchtet nur ihre unmittelbare Umgebung. Die einzige Kabeloberfläche mischt ein einziges Standardmaterial per Fragment-Shader entlang der Kabellänge weich von Grau auf elektrisch leuchtendes Blau; die wandernde Signalkante fadet dadurch kontinuierlich statt dreiecksweise zu springen, und es werden weiterhin keine übereinanderliegenden Kabelröhren gezeichnet. Schmale blaue Energieringe fließen anschließend in Impulsrichtung über den bereits aktivierten Abschnitt. Button und Layer liegen auf derselben Welt-Höhe; der Layer ist von Anfang an räumlich vorhanden und wird nicht eingeblendet.
3. Der Button bleibt während seiner Einführung räumlich vollständig statisch und von Anfang an opak; nur reales Licht macht ihn sichtbar. Eine unsichtbare neutralweiße Punktlichtquelle hält zunächst eindeutig hinter seiner Rückseite und orbitiert anschließend auf einer horizontalen 240-Grad-Kreisbahn im Uhrzeigersinn nach vorne. Das orbitierende Point Light erzeugt über eine `BasicShadowMap` bewusst harte wandernde Schatten. Das Power-Symbol verwendet zunächst ein graues `MeshStandardMaterial` und blendet in der zweiten Hälfte des Lichtorbits unabhängig auf raiOS-blaues Emissive ein. Eine schwache, mit Abstand über der Symbolfläche sitzende blaue Punktlichtquelle beleuchtet Kappe, Rand und nahe Objekte tatsächlich. Der größere Abstand verhindert den harten zentralen Lichtreflex; eine zweite additive Symbolkontur wird nicht mehr gezeichnet. Ab exakt diesem Zeitpunkt fahren Hemisphere- und Key-Light langsam per Smootherstep hinzu, sodass Gehäuse und Rand zunehmend lesbarer werden, ohne den wandernden Lichtakzent abrupt zu überdecken. Danach beginnt der Camera-Rig seinen vollständigen 90-Grad-Orbit um den Button. Gleich zu Beginn des Eindrückens starten der blaue Button-Power-Glow und die Plasmawolke gemeinsam. Während der Orbit positionsseitig ungekürzt weiterläuft, mischt sich der Kamerafokus langsam vom Button auf die Wolke. Am Orbit-Ende übernimmt die Flugbahn aus derselben Position und mit demselben Blickziel. Nach dem vollständig gedrückten Zustand fährt die Kappe weich in ihre Ruheposition zurück; Symbollicht, Emissive und Button-Underglow erlöschen synchron. Der Plasmakern bleibt anschließend als Kameraziel im Bildzentrum, während der Follow kontinuierlich an Höhe und Abstand gewinnt und auf die ursprüngliche Kameraseite zurückorbitiert.

Der schwarze Housing-Sockel besitzt nur ein Fünftel seiner ursprünglichen Tiefe. Der Kabel-Socket sitzt bündig an dieser flachen Rückseite.
4. `chapters/boot-sequence/` übernimmt anschließend als zusammenhängender Objektgraph und veröffentlicht sechs navigierbare Abschnitte. Das separate Kapitel „Handoff vorbereiten“ entfällt vollständig; auf „Kernel laden“ folgt ohne sichtbare Leerlaufstrecke direkt der Kontrollwechsel. Das frühere reine Bare-Metal-Kapitel entfällt ebenfalls: Der in Kapitel 1 erreichte Zustand bleibt als vollständige physische Grundschicht stehen und direkt danach startet Kapitel 2 mit UEFI. Die Bare-Metal-Seitenbeschriftung gehört direkt zum wiederverwendbaren Layer-Feature, blendet bereits während seines Hochfahrens am Ende von Kapitel 1 ein und wird in der Boot-Sequenz nicht dupliziert. Bare Metal, UEFI, Limine und Rust-Kernel beziehen identische Breite, Tiefe und Materialstärke aus einem einzigen Preset; sie liegen im fertigen Zustand exakt auf derselben X/Z-Achse und unterscheiden sich im Stapel nur durch ihre Höhe. Ihre extra-fetten weißen Titel sitzen auf den Seitenflächen, füllen deren Höhe nahezu aus und werden vor der transparenten Oberfläche gerendert. Ein gemeinsamer `SYSTEM_STACK_OFFSET_Y` hebt den vollständigen Systemstapel in Power-on, Boot-Sequenz und Kernel identisch an. Der mittige SPI-Flash bleibt physische Hardware. UEFI wächst aus seinem Footprint, der Stick dockt rechts am Bare Metal an und zwei Signalkabel führen über `USB BOOT` zum `BOOT MANAGER`. Aus dessen Footprint wächst `LIMINE BOOT ENVIRONMENT` mit den beiden einzeiligen Chips `CONFIG` und `KERNEL LOADER`. Sobald der Loader vollständig steht, steigt direkt aus seinem Footprint eine einzige ungeteilte `RUST KERNEL`-Ebene hoch und expandiert ohne fliegende Fragmente oder Übergabeplatten auf das vollständige Systemmaß. Gleich zu Beginn des anschließenden Kontrollwechsels ziehen sich die weiterhin leuchtenden UEFI-Kabel sichtbar zurück; danach folgt Limine und UEFI leicht versetzt. Der SPI-Flash bleibt bestehen und der Kernel dockt direkt auf Bare Metal an.
Die Story endet mit der Landung des vollständigen Rust-Kernel-Layers. Eine separate anschließende Kernel-Innenansicht und ihre frühere 3×2-Aufteilung existieren nicht mehr.

Die Zeitfenster und das räumliche Layout des Einschaltvorgangs liegen getrennt in `chapters/power-on/timeline.js` und `chapters/power-on/layout.js`. Die semantischen Boot-Zeitfenster liegen entsprechend in `features/boot-sequence/timeline.js`; der Orchestrator enthält keine anonymen Timing-Zahlen mehr. Form und Material des Buttons, Kabels und Layers gehören zu ihren Features beziehungsweise allgemeinen Objekten und enthalten keine Story-Zeitwerte.

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

Syntax, lokalen Modulgraph und Produktions-Build gemeinsam prüfen:

```powershell
npm run check
```

Nur den statischen Produktions-Build ausführen:

```powershell
npm run build
```

`npm run check` führt `node --check` für alle JavaScript-Dateien aus, validiert alle lokalen Imports, meldet von `src/main.js` unerreichbare Module als Dead Code und startet anschließend den Build. Der Build kopiert ausschließlich das Scroll-Projekt nach `pages-dist/` und prüft lokale Datei-Referenzen sowie die Cloudflare-Dateigrößenbegrenzung. `pages-dist/` enthält generierte Dateien und wird nicht committed.

## Lizenz

Siehe [LICENSE](LICENSE).
