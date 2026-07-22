# raiOS · The Factory Moves In · Real 3D

Dieser Branch rekonstruiert den rund zweiminütigen 2,5D-Architekturfilm der raiOS-
Website als eigenständige, echte Three.js-Szene. Der Film auf `main` dient nur
als visuelle und zeitliche Referenz; UI-Lab-SVG, CSS und Produktionskomponenten
werden nicht kopiert.

## Ziel

Aus der festgelegten orthografischen Filmkamera soll der native 3D-Nachbau die
Komposition des Originals möglichst genau erhalten. Alle Layer, Maschinen,
Türen, Leitungen, Workpieces und App-Inseln besitzen jedoch echte räumliche
Tiefe. Über `FREE ORBIT` lässt sich jedes aktuelle Filmbild frei im Raum
betrachten, ohne die deterministische Filmfassung zu verändern.

## Filmvertrag

- Dauer: `148` Sekunden
- Szenen: `14`
- Kamera-Keyframes: `23`
- Scrollstrecke: `1600svh` plus ein sichtbarer Viewport
- Autoplay: eine Filmsekunde pro realer Sekunde
- Finale: `1` kompakte Player-Insel plus `60` echte App-Layer
- Reduced Motion: deterministisches Poster bei Sekunde `146`

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
die Sekunden `41–148`. Wiederholte Produktionspfade und das Insel-Finale nutzen
gemeinsame Konfiguration und wiederverwendbare Objektverträge statt duplizierter
Szenenlogik.

### Layer- und Callout-Vertrag

Rust-Kernel, Genesis Layer, Builder Layer, Shadow VM und Player Domain verwenden
`objects/shared/vector-layer.js`. Größe, Höhe, Farbe, Grid und Boden-Pivot sind
Konfiguration; der deterministische Aufbau ist immer gleich: Zuerst zeichnet
sich der Grundriss auf dem Trägerboden, danach wächst der massive Layer bei
unveränderter Position bis zu seiner vollen Höhe. Eigene Szenen dürfen Layer
nicht mehr durch Verschieben oder Skalieren der gesamten Gruppe einblenden.
Beim Outro läuft derselbe Vertrag rückwärts: Der Körper sinkt zuerst in seine
Trägerfläche zurück, anschließend wird der verbleibende Grundriss gelöscht.

Ab Kapitel 13 schrumpft die Player-Domain über `setVectorLayerFootprint` auf
`18 %` und fährt als erste private App-Insel bündig an die freie Kante des
Genesis Layers. `PLAYER.WASM` bleibt währenddessen auf dieser Insel verankert
und bewegt sich nicht unabhängig von ihr. Danach entstehen `60` App-Inseln von
diesem Startpunkt aus ausschließlich auf der sichtbaren Rust-Kernel-Fläche,
ohne Genesis oder die Player-Insel zu überdecken. Ihre Breiten und Tiefen
variieren, aber alle besitzen exakt dieselbe Sockelhöhe und Oberkante wie die
Player-Insel. Sie bauen sich nacheinander über denselben `vector-layer`-
Lifecycle aus Grundriss und aufwachsendem Körper auf.
Die vorhandenen drei Türen und Capability-Kabel der Player-Domain bleiben beim
Schrumpfen erhalten, skalieren mit der Insel und führen ihre Endpunkte während
des Andockens dynamisch nach. Agent und Genesis Layer bleiben dabei unverändert
bestehen. Das Finale spawnt keine zusätzliche Tür. Zwischen den danach
entstehenden App-Inseln gibt es keine verbindenden Kabel oder Signallinien.
Bereits entstandene Inseln driften oder pulsieren anschließend nicht weiter;
fertige Layerzustände werden zudem nicht in jedem Frame erneut aufgebaut.

Die zugehörigen Erklärtafeln verwenden `objects/shared/vector-callout.js`.
Dieses Modul öffnet das Panel mit festem Viewport-Padding rechts unten vor der
Kamera, schreibt Titel und Text, bewegt
es anschließend zum Ziel und aktualisiert die Verbindungslinie bei jeder
Kamera- oder Objektbewegung. Inhalt, Akzentfarbe, Zielpunkt und Zeitfenster
bleiben reine Konfiguration.
Der Callout beginnt gleichzeitig mit dem Zeichnen des zugehörigen
Layer-Grundrisses. Nach dem vollständigen Ausschreiben bleibt das Panel fünf
Sekunden rechts unten stehen; erst danach startet seine Dock- und
Outroanimation.

### Maschinenvertrag

Agent, `PLAYER.RS`/`PLAYER.WASM`, Compiler, Tester und Guard verwenden
`objects/shared/vector-machine.js`. Das Modul definiert die gemeinsame
Körpergeometrie, Flächen, Outlines, Detailstreifen, Schatten und den Aufbau vom
gezeichneten Grundriss zum aufwachsenden Programm. Programme besitzen kein
Dachlicht. Auf der Front steht genau ein weißer Programmname;
Schrift, Größe und Position werden ausschließlich im gemeinsamen Modul
festgelegt. Szenen liefern weder Untertitel noch eigene Textfarben oder
Labelgrößen. Zustände werden ausschließlich über integrierte Seitenlampen
dargestellt: Gelb bedeutet ausstehend, Grün bestanden und Rot fehlgeschlagen.
Der Compiler besitzt eine Lampe, Tester und Guard besitzen je drei; der Agent
besitzt keine. Beim Tester repräsentiert jede Lampe genau einen der drei
Testakte und wechselt unabhängig von Gelb auf Grün beziehungsweise beim ersten
Fehlschlag auf Rot. Anzahl, Geometrie und Zustandsfarben sind Teil des
gemeinsamen Vertrags.
Eine Maschine wird über ihre Trägerfläche und X/Z-Koordinaten verankert; ihre
Höhe darf nicht in einzelnen Szenen frei geschätzt werden. Auf dem Builder Layer
stehen der Compiler in der unteren Ecke, der Tester in der rechten Ecke und der
Guard direkt vor `/out`. Erst die Freigabeanimation bewegt den Guard auf
derselben Ebene eine halbe Position zur Seite. Nach der Bestätigung verschwindet
der Dialog sofort, die dritte Guard-Lampe wird grün und `/out` wechselt ohne
zusätzliche Verbindungsleitung auf Grün, bevor sich die Tür öffnet.

Die optionale Fortschrittsanzeige ist ebenfalls Teil von `vector-machine.js`
und standardmäßig ausgeblendet. Sie wird über die gemeinsame Maschinen-API
geschaltet und bleibt dadurch bei jeder Kamerapose direkt über ihrem Programm
verankert. Der Compiler zeigt sie ausschließlich während des Kompilierens, der
Tester ausschließlich während eines Tests; Guard, Agent und `PLAYER.WASM`
erzeugen keine Progress-Bar. Die Anzeige besteht nur aus einer dicken,
abgerundeten Bar und genau einem Tätigkeitswort darunter (`Compiling` oder
`Testing`). Rundennummern, Prozenttexte, Versionszeilen und Statusmeldungen
gehören nicht in das Overlay; Ergebnisse werden über die Maschinenlampen
dargestellt. Die Anzeige rendert als heller, tiefenunabhängiger Vordergrundpass,
damit Layer, Kabel und Workpiece sie nicht überzeichnen.

`PLAYER.WASM` verwendet feste Dock-Positionen neben Tester, hinter Compiler und
vor Guard. Es holt ein sichtbares Compiler-Paket am Compiler ab, nimmt beim
Tester nacheinander drei Prüfsiegel auf und transportiert alle vier Objekte zum
Guard. Erst die sichtbare Übergabe schaltet die zugehörigen Guard-Lampen auf
Grün; Prozessstatus darf den stabilen Objektnamen `PLAYER.WASM` nicht ersetzen.
Jeder Stationsbesuch beginnt und endet an derselben freien Mittelposition. Die
Dockpunkte halten mindestens eine Gehäusebreite Abstand zur jeweiligen
Maschine, sodass Workpiece, Programmname und Fortschrittsanzeige nicht
überlappen.

### Türvertrag

Alle regulären Filmtüren verwenden `objects/shared/vector-door.js`. Eine Tür
wird ausschließlich durch ihre Trägerfläche sowie `edge` (`front`, `back`,
`left`, `right`) und `along` beschrieben. Das Modul leitet daraus Höhe,
rechtwinklige Ausrichtung, den vollständig außerhalb liegenden Vorbau, die
Öffnungsrichtung zum Vorbau und die mittige Labelposition ab. Szenen dürfen
diese Werte nicht nachträglich per `position`, `rotation` oder `hinge` ändern.
Font und Größe sämtlicher Türlabels werden ebenfalls ausschließlich dort
definiert; Szenen liefern nur Text und Farbe. Der Vorbau besitzt eine
vollständig opake Bodenfläche und übernimmt deren Farbe aus der jeweiligen
Trägerfläche (zum Beispiel blau oder violett).
Der deterministische Aufbau ist ebenfalls Teil des Moduls: Der Vorbau wächst
von der Layerkante nach außen, danach schreibt sich das Label und erst dann
fährt der Türrahmen aus der Ebene hoch. Die geteilte Bodenklappe wird nur für
eigenständige Objekte wie den NET-Turm verwendet, nicht für Türen.
Beim Outro schließt zuerst das Blatt, danach sinkt der Rahmen, der Text wird
rückwärts gelöscht und zuletzt zieht sich der Vorbau in die Layerkante zurück.
Nur tatsächlich freistehende Sonderobjekte dürfen die separat benannte
`createFreestandingFactoryDoor`-API verwenden.

### Schlüssel- und Forge-Vertrag

Die Key Forge ist kein Turm und kein Marker, sondern eine bündige, geteilte
Bodenklappe im Genesis Layer. Für jede Freigabe läuft dieselbe deterministische
Sequenz: Die Klappe öffnet, der Schlüssel steigt aus der Ebene, dreht sich kurz
zur Präsentation, fliegt ohne zusätzliche Forge-Signalleitung zum Ziel, wird in
das Schloss gesteckt und dort gedreht. Erst nach dieser Schlossdrehung öffnet
die zugehörige Tür; anschließend blendet der Schlüssel aus. Alle Schlüssel
verwenden dieselbe Zustandsfunktion, damit direktes Springen sowie Vorwärts-
und Rückwärtsscrollen identische Zustände ergeben.

### Kabelvertrag

Signal- und Materialleitungen verwenden `objects/shared/vector-cable.js`.
Bodenpunkte referenzieren eine Trägerfläche statt einer frei geschätzten
Y-Position. Bei einem Layerwechsel erzeugt `cableEdgeDrop` einen sichtbaren
Weg über die Außenkante und senkrecht an ihrer Seite hinab beziehungsweise
hinauf; Kabel dürfen deshalb nicht diagonal in einer Ebene verschwinden. Jede
Leitung besitzt explizit die Richtung `forward`, `reverse`, `bidirectional`
oder `none`. `none` ist statischen Layerrastern vorbehalten. Türverbindungen
laufen mit `cableDoorLandingDrop` zunächst über den vollständigen Vorbau und
erst an dessen Außenkante nach unten. Technische Fillets runden alle möglichen
Waypoints mit engem Radius ab. Signalpulse starten erst, wenn die Leitung
vollständig aufgebaut und verbunden ist.
Bewegte Quelldateien verwenden `createVectorCableJourney` und lesen ihre
Position direkt aus den Kurven der sichtbaren Kabelabschnitte. Sie besitzen
keinen separaten, unsichtbaren Flugpfad.
Bewegt oder skaliert sich ein angeschlossenes Objekt, kann derselbe
Kabelvertrag seine Wegpunkte aktualisieren und die vorhandenen Segmente neu
ausrichten; dabei werden weder Kabelobjekt noch Geometrien pro Frame neu
erzeugt.
Beim Outro wird die Leitung entlang derselben Route bis zu ihrem Ursprung
zurückgezogen; währenddessen kann kein Signal weiterlaufen.
Der Eintritt in die Shadow VM ist ausdrücklich kein Signalweg: Eine sichtbare
lilafarbene `PLAYER.WASM · GHOST COPY` bewegt sich als echtes 3D-Objekt durch
die geöffnete `shadow.in`-Tür. Dafür darf weder Kabel noch Puls gezeichnet
werden.

### Shadow-VM-Vertrag

Der erste Besuch beim Tester führt einen zwölf Sekunden langen violetten
Akt-1-Probelauf aus. Ghost-Eintritt, Mock-I/O, Dateidrop, die nur bis
`653 / 654` laufenden Claims und der abschließende Frame-Hash-Mismatch werden
nacheinander gezeigt; erst danach scheitert die Kammer geschlossen und baut
sich rückwärts ab. Nach Korrektur und erneutem Kompilieren
bleibt `PLAYER.WASM` für den vollständigen zweiten Besuch am Tester stehen:
Akt 1 wird als violette Claim-Prüfung wiederholt, Akt 2 erzeugt zwei gelbe
Testplattformen mit gleichzeitig laufenden Programmkopien und lässt die
sichtbare Divergenz über einer gestrichelten 3D-Regenbogenbrücke auf `0%`
fallen, Akt 3 prüft in einer hellblauen Fail-Closed-Kammer sieben Angriffe.
Jeder Akt baut seine eigene disposable Plattform vollständig auf und wieder
ab. Vor jedem neuen Akt reist eine neue, mit `PLAYER.WASM` geometrisch und
visuell identische Ghost Copy von dessen aktueller Position beim Tester durch
die neue VM-Tür. Der erfolgreiche violette Akt 1 erhält knapp elf Sekunden und
spielt Mock-I/O, Dateidrop und alle 654 Claims lesbar nacheinander aus. Erst
nach dem dritten bestandenen Akt nimmt das Programm alle drei
Prüfsiegel auf und transportiert sie zum Guard.

## Kamera

Die SVG-Kamera des Referenzfilms war ein 2D-Pan/Zoom mit `scale`, `focusX` und
`focusY`. Der Nachbau übersetzt diese Werte auf eine echte orthografische Kamera
mit einer räumlichen isometrischen Blickrichtung. Referenzformat, Widescreen-
Korrektur, vertikaler Bias, die 18 Original-Keyframes, fünf zusätzliche
Shadow-VM-Keyframes und deren Smoothstep-Interpolation bleiben erhalten.
`FREE ORBIT` friert die aktuelle Filmzeit ein
und aktiviert Drehen, Zoomen und Verschieben mit Maus oder Touch. `EXIT ORBIT`,
PLAY oder ein Kapitelsprung stellt die Filmkamera wieder exakt her.

Für gezielte Bildvergleiche kann eine Filmsekunde direkt geöffnet werden, zum
Beispiel `http://127.0.0.1:5174/?time=17`.

## Visueller A/B-Abgleich

Der folgende Befehl baut den aktuellen Stand und erzeugt für die ersten
Foundation-Schlüsselbilder jeweils einen Screenshot des Originalfilms, des
Three.js-Films und eine beschriftete Gegenüberstellung. Ein bereits laufender
Dev-Server ist dafür nicht nötig:

```powershell
npm run capture:compare
```

Andere Filmsekunden lassen sich gezielt prüfen:

```powershell
npm run capture:compare -- --times=21.2,27.2,37
```

Die Aufnahmen verwenden für beide Filme denselben Viewport und liegen nur lokal
unter `.visual-comparisons/latest/`. Das Referenz-Worktree wird standardmäßig
unter `../raios-film-reference` erwartet; mit `--reference-root=...` kann ein
anderer Pfad angegeben werden.

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
