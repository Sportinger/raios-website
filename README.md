# raiOS · The Factory Moves In · Real 3D

Dieser Branch rekonstruiert den zweiminütigen 2,5D-Architekturfilm der raiOS-
Website als eigenständige, echte Three.js-Szene. Der Film auf `main` dient nur
als visuelle und zeitliche Referenz; UI-Lab-SVG, CSS und Produktionskomponenten
werden nicht kopiert.

## Ziel

Aus der festgelegten orthografischen Filmkamera soll der native 3D-Nachbau die
Komposition des Originals möglichst genau erhalten. Alle Decks, Maschinen,
Türen, Leitungen, Workpieces und App-Inseln besitzen jedoch echte räumliche
Tiefe. Über `FREE ORBIT` lässt sich jedes aktuelle Filmbild frei im Raum
betrachten, ohne die deterministische Filmfassung zu verändern.

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

### Layer- und Callout-Vertrag

Rust-Kernel, Genesis Deck, Builder Deck, Shadow VM und Player Domain verwenden
`objects/shared/vector-layer.js`. Größe, Höhe, Farbe, Grid und Boden-Pivot sind
Konfiguration; der deterministische Aufbau ist immer gleich: Zuerst zeichnet
sich der Grundriss auf dem Trägerboden, danach wächst der massive Layer bei
unveränderter Position bis zu seiner vollen Höhe. Eigene Szenen dürfen Layer
nicht mehr durch Verschieben oder Skalieren der gesamten Gruppe einblenden.

Die zugehörigen Erklärtafeln verwenden `objects/shared/vector-callout.js`.
Dieses Modul öffnet das Panel vor der Kamera, schreibt Titel und Text, bewegt
es anschließend zum Ziel und aktualisiert die Verbindungslinie bei jeder
Kamera- oder Objektbewegung. Inhalt, Akzentfarbe, Zielpunkt und Zeitfenster
bleiben reine Konfiguration.

### Maschinenvertrag

Agent, Compiler, Tester und Guard verwenden
`objects/shared/vector-machine.js`. Das Modul definiert die gemeinsame
Körpergeometrie, Flächen, Outlines, Detailstreifen, Schatten und den Aufbau vom
gezeichneten Grundriss zum aufwachsenden Programm. Programme besitzen kein
Dachlicht. Auf der Front steht genau ein weißer Programmname;
Schrift, Größe und Position werden ausschließlich im gemeinsamen Modul
festgelegt. Szenen liefern weder Untertitel noch eigene Textfarben oder
Labelgrößen. Zustände werden ausschließlich über integrierte Seitenlampen
dargestellt: Gelb bedeutet ausstehend, Grün bestanden und Rot fehlgeschlagen.
Compiler und Tester besitzen je eine Lampe, der Guard drei; der Agent besitzt
keine. Anzahl, Geometrie und Zustandsfarben sind Teil des gemeinsamen Vertrags.
Eine Maschine wird über ihre Trägerfläche und X/Z-Koordinaten verankert; ihre
Höhe darf nicht in einzelnen Szenen frei geschätzt werden. Auf dem Builder Deck
stehen der Compiler in der unteren Ecke, der Tester in der rechten Ecke und der
Guard direkt vor `/out`. Erst die Freigabeanimation bewegt den Guard auf
derselben Ebene zur Seite.

Nur Compiler und Tester besitzen eine Fortschrittsanzeige. Sie wird an die
jeweilige Maschine angeheftet und sitzt deshalb bei jeder Kamerapose direkt
über ihr. Beide Anzeigen rendern als heller, tiefenunabhängiger Vordergrundpass,
damit Deck, Kabel, Workpiece und transparente Panels sie nicht überzeichnen.
Guard und `PLAYER.WASM` erzeugen keine Progress-Bar und kein schwebendes
Statuspanel.

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
von der Deckkante nach außen, danach schreibt sich das Label und erst dann
fährt der Türrahmen aus der Ebene hoch. Die geteilte Bodenklappe wird nur für
eigenständige Objekte wie den NET-Turm verwendet, nicht für Türen.
Nur bewusst freistehende Objekte wie die kompakte Finaltür verwenden die
separat benannte `createFreestandingFactoryDoor`-API.

### Schlüssel- und Forge-Vertrag

Die Key Forge ist kein Turm und kein Marker, sondern eine bündige, geteilte
Bodenklappe im Genesis Deck. Für jede Freigabe läuft dieselbe deterministische
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
oder `none`. `none` ist statischen Deckrastern vorbehalten. Türverbindungen
laufen mit `cableDoorLandingDrop` zunächst über den vollständigen Vorbau und
erst an dessen Außenkante nach unten. Technische Fillets runden alle möglichen
Waypoints mit engem Radius ab. Signalpulse starten erst, wenn die Leitung
vollständig aufgebaut und verbunden ist.
Der Eintritt in die Shadow VM ist ausdrücklich kein Signalweg: Eine sichtbare
lilafarbene `PLAYER.WASM · GHOST COPY` bewegt sich als echtes 3D-Objekt durch
die geöffnete `shadow.in`-Tür. Dafür darf weder Kabel noch Puls gezeichnet
werden.

## Kamera

Die SVG-Kamera des Referenzfilms war ein 2D-Pan/Zoom mit `scale`, `focusX` und
`focusY`. Der Nachbau übersetzt diese Werte auf eine echte orthografische Kamera
mit einer räumlichen isometrischen Blickrichtung. Referenzformat, Widescreen-
Korrektur, vertikaler Bias, die 18 Original-Keyframes und deren Smoothstep-
Interpolation bleiben erhalten. `FREE ORBIT` friert die aktuelle Filmzeit ein
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
