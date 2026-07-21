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

Ein langes Kapitel kann über `navigationSections` eigene, lokal normierte Unterkapitel veröffentlichen. Die Story rechnet deren Start- und Endwerte automatisch in globale Scrollpositionen um. Die Boot-Sequenz nutzt dies für die sichtbaren Kapitel 2–8, bleibt intern aber ein einziger Objektgraph. Diese Navigationsanker sind reine inhaltliche Metadaten: Sie schneiden weder die Kamerafahrt noch eine andere Animation in einzelne Clips. Ihre Positionen können daher frei verschoben werden, ohne an der Kapitelgrenze einen Kamerastopp zu erzeugen. Dadurch werden komplexe Features und große Labeltexturen nicht siebenfach dupliziert.

Die Debug-Anzeige links oben nennt den globalen `SCROLL`-Fortschritt und den lokalen Fortschritt des aktiven sichtbaren `KAPITEL`-Abschnitts jeweils mit vier Nachkommastellen. Damit lassen sich Timing-Korrekturen eindeutig benennen, ohne Werte aus der Scrollposition schätzen zu müssen.

### Features

Ein Feature ist ein komplexer, fachlich abgegrenzter Darsteller. `features/rust-kernel/` besitzt beispielsweise Konfiguration, Inhalt, Aufbau und Lifecycle des Rust-Kernels. `features/power-button/` kombiniert den allgemeinen Druckknopf mit dem raiOS-Power-Symbol. Ein Feature kennt weder die Scrollposition noch die Position seines Kapitels in der Gesamtgeschichte.

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

UEFI und Limine verwenden beide `objects/layers/expanding-stage-layer/`. Dieses
Objekt kapselt Geometrie, Kanten, Seitentitel sowie Aufsteigen, Expansion und
Rückzug. Die Features liefern nur Quelle, Zielhöhe, Material und eigene Inhalte.
`objects/layers/system-layer-preset.js` hält zusätzlich die identischen Maße von
Bare Metal, UEFI, Limine und Rust-Kernel fest. Dadurch bleiben alle vollständigen
Schichten deckungsgleich, ohne dieselben Zahlen oder Transformationsabläufe in
mehreren Features zu duplizieren.

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
├── boot-usb/            Mechanischer Stick, ESP und BOOTX64.EFI
├── limine-stage/        Temporäre Vollschicht mit Config, Loader und Handoff
├── kernel-platform/     Datenstrom, Aufbau, Landung und Laufpuls
└── boot-sequence/       Deterministische Komposition aller Phasen
```

Die wiederverwendbaren Grundbausteine `objects/cards/`, `objects/connections/cable/`, `objects/effects/energy-flow/` und `objects/effects/data-stream/` kennen diese Fachbegriffe nicht. Auch der UEFI-Pfad vom physischen USB-Port zum USB-Boot-Service verwendet das allgemeine Kabel: Nur seine weich verlegte Route liegt im UEFI-Feature, während progressive Blauaktivierung und Energieringe aus den bestehenden neutralen Objekten kommen. Sprechertexte und Audio sind bewusst nicht Bestandteil der aktuellen Implementierung.

`chapters/boot-sequence/create-camera-choreography.js` definiert sieben fachliche Zwischenposen. Zuerst fährt die Kamera ihren 70-Grad-UEFI-Reveal-Orbit gegen den Uhrzeigersinn vollständig zu Ende. Direkt von dessen Endposition führt sie das globale Scrollfenster `0.2272–0.2625` in einem zweiten 80-Grad-Orbit im Uhrzeigersinn zurück auf die USB-Seite. Eine in derselben Drehrichtung berechnete tangentiale Austrittspose verbindet ihn ohne Halt mit der anschließenden kontinuierlichen Spline über USB, Limine, Kernel und Kontrollübergabe zurück nach Home. Die Kamera erhält ausschließlich den Gesamtfortschritt der Boot-Sequenz und kennt weder Kapitelnummern noch Abschnittsgrenzen; die Orbits liegen deshalb als eigene Zeitfenster in der Kamera-Choreografie und nicht in `navigationSections`. Ein Smootherstep mit kleiner erhaltener Restgeschwindigkeit verhindert künstliche Vollstopps an den Übergängen. Die frühen Boot-Posen bleiben bewusst perspektivisch: Platte, schwebende UEFI-Ebene und der in den physischen Port eingesteckte USB-Stick sind dadurch gleichzeitig räumlich lesbar.

## Kapitel ergänzen

Ein Kapitel exportiert mindestens `id`, `group`, `update(progress)`, `resize(viewport)` und `dispose()`. Danach wird es in `story/story-map.js` mit einem Gewicht registriert. Prozentwerte eines Kapitels bleiben lokal und verändern keine späteren Kapitel.

Für Reduced Motion setzt die Runtime den Storyfortschritt auf den fertigen Zustand. Neue Kapitel und Objekte müssen deshalb für jeden Fortschrittswert deterministisch denselben Zustand darstellen.

### Aktuelle Story

1. `chapters/power-on/` richtet den Power-Button frontal zur Startkamera aus, drückt ihn automatisch und blendet ihn nach dem Einschalten aus.
2. Ein von Anfang an vollständig sichtbares, grau-metallisches Kabel beginnt mittig an der Rückseite des Buttons, läuft zunächst gerade aus dem Gehäuse, sinkt auf eine unsichtbare Bodenhöhe ab und schlängelt sich erst dort bis an die Seitenkante des weit entfernten `BARE METAL`-Layers. Eine kompakte organische Plasmawolke startet synchron mit dem Beginn des Button-Presses und seines blauen Power-Glows. Der Kern besteht vollständig aus einer dichten, unregelmäßigen Plasma-Sprite; eine schneidende 3D-Kerngeometrie wird nicht mehr verwendet. Direkt hinter dem Button und vor dem Ziel-Layer respektiert sie den Szenen-Depth-Test. Auf der freien Kabelstrecke rendert nur diese dichte Kernschicht vor dem Kabel und verdeckt es dadurch aus jedem Kamerawinkel ohne harte ovale Schnittkanten. Die äußeren Layer bleiben tiefengeprüft und lösen die Wolke über rotierende Plasmafilamente und einen kurzen Nachschweif weich auf. Ein zurückhaltendes mitwanderndes Punktlicht beleuchtet nur ihre unmittelbare Umgebung. Die einzige Kabeloberfläche mischt ein einziges Standardmaterial per Fragment-Shader entlang der Kabellänge weich von Grau auf elektrisch leuchtendes Blau; die wandernde Signalkante fadet dadurch kontinuierlich statt dreiecksweise zu springen, und es werden weiterhin keine übereinanderliegenden Kabelröhren gezeichnet. Schmale blaue Energieringe fließen anschließend in Impulsrichtung über den bereits aktivierten Abschnitt. Button und Layer liegen auf derselben Welt-Höhe; der Layer ist von Anfang an räumlich vorhanden und wird nicht eingeblendet.
3. Der Button bleibt während seiner Einführung räumlich vollständig statisch und von Anfang an opak; nur reales Licht macht ihn sichtbar. Eine unsichtbare neutralweiße Punktlichtquelle hält zunächst eindeutig hinter seiner Rückseite und orbitiert anschließend auf einer horizontalen 240-Grad-Kreisbahn im Uhrzeigersinn nach vorne. Das orbitierende Point Light erzeugt über eine `BasicShadowMap` bewusst harte wandernde Schatten. Das Power-Symbol verwendet zunächst ein graues `MeshStandardMaterial` und blendet in der zweiten Hälfte des Lichtorbits unabhängig auf raiOS-blaues Emissive ein. Eine schwache, mit Abstand über der Symbolfläche sitzende blaue Punktlichtquelle beleuchtet Kappe, Rand und nahe Objekte tatsächlich. Der größere Abstand verhindert den harten zentralen Lichtreflex; eine zweite additive Symbolkontur wird nicht mehr gezeichnet. Ab exakt diesem Zeitpunkt fahren Hemisphere- und Key-Light langsam per Smootherstep hinzu, sodass Gehäuse und Rand zunehmend lesbarer werden, ohne den wandernden Lichtakzent abrupt zu überdecken. Danach beginnt der Camera-Rig seinen vollständigen 90-Grad-Orbit um den Button. Gleich zu Beginn des Eindrückens starten der blaue Button-Power-Glow und die Plasmawolke gemeinsam. Während der Orbit positionsseitig ungekürzt weiterläuft, mischt sich der Kamerafokus langsam vom Button auf die Wolke. Am Orbit-Ende übernimmt die Flugbahn aus derselben Position und mit demselben Blickziel. Nach dem vollständig gedrückten Zustand fährt die Kappe weich in ihre Ruheposition zurück; Symbollicht, Emissive und Button-Underglow erlöschen synchron. Der Plasmakern bleibt anschließend als Kameraziel im Bildzentrum, während der Follow kontinuierlich an Höhe und Abstand gewinnt und auf die ursprüngliche Kameraseite zurückorbitiert.

Der schwarze Housing-Sockel besitzt nur ein Fünftel seiner ursprünglichen Tiefe. Der Kabel-Socket sitzt bündig an dieser flachen Rückseite.
4. `chapters/boot-sequence/` übernimmt anschließend als zusammenhängender Objektgraph und veröffentlicht sieben navigierbare Abschnitte. Das frühere reine Bare-Metal-Kapitel entfällt: Der in Kapitel 1 erreichte Zustand bleibt als vollständige physische Grundschicht stehen und direkt danach startet Kapitel 2 mit UEFI. Die Bare-Metal-Seitenbeschriftung gehört direkt zum wiederverwendbaren Layer-Feature, blendet bereits während seines Hochfahrens am Ende von Kapitel 1 ein und wird in der Boot-Sequenz nicht dupliziert. Bare Metal, UEFI, Limine und Rust-Kernel beziehen identische Breite, Tiefe und Materialstärke aus einem einzigen Preset; sie liegen exakt auf derselben X/Z-Achse und unterscheiden sich im Stapel nur durch ihre Höhe. Ihre extra-fetten weißen Titel sitzen auf den Seitenflächen und füllen deren Höhe nahezu aus. Graue Erklärungszeilen werden nicht gerendert. Ein gemeinsamer `SYSTEM_STACK_OFFSET_Y` hebt den vollständigen Systemstapel in Power-on, Boot-Sequenz und Kernel identisch an, ohne Kabel oder Button zu verschieben. Dadurch trifft das Kabel die Seitenkante mittig und alle späteren Layer behalten ihre relativen Abstände. Der mittig sitzende, deutlich erhöhte SPI-Flash ist zunächst das einzige eigenständige Hardwareobjekt und zeigt seitlich nur `SPI FLASH`. CPU, RAM, Chipsatz und Controller werden weder als Kästen noch als graue Platzhalter gezeigt. Auch ein USB-Stecker oder Port-Rahmen bleibt in Kapitel 2 vollständig unsichtbar und wird erst weich mit der USB-Szene in Kapitel 3 eingeführt. Die UEFI-Fläche übernimmt anfangs exakt den SPI-Footprint `1.55 × 0.28 × 0.58`, steigt kompakt auf Zielhöhe und expandiert dort in alle drei Achsen. Danach folgt die Bootbewegung konsequent von rechts nach links: Der Stick dockt rechts am Bare Metal an, `USB BOOT` erscheint direkt darüber, `BOOT MANAGER` folgt in der Mitte und ein einzelnes `BOOTX64.EFI`-Paket entfaltet darüber die vollständige `LIMINE BOOT STAGE`. Auf Limine läuft der aktive Pfad durch `CONFIG`, `KERNEL LOADER` und `HANDOFF`. Jeder alte Pfad dimmt vor dem nächsten; erst danach bleibt ausschließlich der Datenpfad zum Rust-Kernel aktiv. Kreuzende oder rückwärts laufende Leitungen existieren nicht. Das gemeinsame `expanding-stage-layer` kapselt für UEFI und Limine Geometrie, Seitentitel, Aufstieg, Expansion und Rückzug. Nach dem sichtbaren Handoff ziehen sich Limine und UEFI gemeinsam zurück, der SPI-Flash bleibt physisch bestehen und der Kernel dockt direkt auf Bare Metal an.
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
