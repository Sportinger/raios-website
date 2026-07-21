# Boot Sequence

Die Boot-Sequenz ist ein einziger langlebiger 3D-Objektgraph für die sichtbaren
sechs Boot-Szenen. Das Kapitel übersetzt seinen lokalen Scrollwert in `sceneIndex`
und `progress`; das Feature setzt daraus sämtliche vorherigen Phasen auf `1`,
die aktuelle Phase auf `progress` und alle späteren Phasen auf `0`.

Dieser Vertrag macht Direktansprünge, Rückwärtsscrollen, Reduced Motion und HMR
deterministisch. Die einzelnen Darsteller kennen weder Scrollpositionen noch
Kapitelnummern. Neue Phasen werden benannt in `config.js` registriert, ihre
Zeitfenster liegen ausschließlich in `timeline.js`, und
`create-boot-sequence.js` bildet beides auf semantische Feature-Zustände ab.

Das frühere reine Bare-Metal-Unterkapitel existiert nicht mehr. Kapitel 1 stellt
die physische Plattform bereits fertig her; die erste Boot-Phase beginnt deshalb
direkt mit UEFI und wird in der Navigation als Kapitel 2 veröffentlicht. Eine
separate Phase „Handoff vorbereiten“ gibt es nicht mehr: Nach dem Kernel-Aufbau
beginnt unmittelbar der Kontrollwechsel.

Die Kamera bleibt Kapitelverantwortung. `chapters/boot-sequence/` beendet zuerst
den UEFI-Reveal-Orbit und den USB-Rückorbit. Danach läuft sie nur noch weich bis
zur lokal im Boot-Kapitel festgelegten Endpose aus. Ab dieser Pose existieren
keine weiteren Kamera-Keyframes; die Kamera bleibt für alle
folgenden Boot-Phasen konstant. UEFI und USB bleiben dadurch perspektivisch und
wechseln nicht in eine Draufsicht.

Die visuelle Hierarchie ist bindend: Bare Metal und Rust-Kernel sind vollständige
dauerhafte Schichten. UEFI und Limine sind temporäre vollständige
Softwareschichten. Alle vier Vollschichten beziehen Breite, Tiefe und Dicke aus
dem gemeinsamen `SYSTEM_LAYER_SIZE`-Preset, liegen exakt auf derselben X/Z-Achse
und unterscheiden sich im Stapel nur durch ihre Höhe. SPI-Flash, USB-Port, Boot
Manager und USB Boot Service sind Objekte. Der Stick dockt ausschließlich am
physischen Port an. Nach dem Handoff lösen sich zuerst beide UEFI-Kabel auf.
Danach zieht sich Limine zurück; UEFI folgt mit leichter zeitlicher Überlappung.
Der SPI-Flash bleibt als inaktive Hardware bestehen.

Die Kernel-Landung beginnt bereits im Kontrollwechsel bei lokalem Fortschritt
`0.40` und läuft ohne Neustart über die folgende Kapitelgrenze hinweg bis zur
endgültigen Position auf dem Bare Metal.

Die UEFI-Fläche verwendet unabhängig vom Scrollabschnitt vollständige
physikalische Transmission. Sichtbarkeit und Form entstehen ausschließlich
über Entfaltung, Brechung, Studio-Reflexionen, Volumenabsorption und die
cyanfarbenen Kanten; eine nachträgliche Deckkraftverdichtung existiert nicht.

UEFI schreibt als Transmission-Glas keine Tiefe. Limine bleibt eine
alpha-basierte, tiefenschreibende Softwareschicht. Der Kernel ist eine einzige
ungeteilte Fläche mit `0.90` Deckkraft und
bleibt damit als eigene räumliche Ebene lesbar.

Der Datenfluss besitzt eine feste Leserichtung von rechts nach links:

```text
USB-Stick → USB Boot Service → Boot Manager → Limine → Rust-Kernel
```

USB Boot Service und Boot Manager sitzen mit großem Abstand symmetrisch rechts
und links der Schichtmitte. Aus dem Footprint des Boot Managers steigt die
vollständige Limine-Schicht kompakt auf und expandiert erst auf Zielhöhe;
auf ihr läuft der einzige interne Pfad von `CONFIG` nach `KERNEL LOADER`.
Der spätere Handoff ist ein Übergabeereignis und kein dritter Chip. Power-on und
die physischen USB-Pfade verwenden dieselbe wiederverwendbare Komposition
`transient-signal-cable` aus Kabel, Energieringen und Lichtkopf. Die erste
feature-spezifische Route beginnt innerhalb des eingesteckten Sticks, läuft kurz
horizontal durch Bare Metal, steigt mit engen abgerundeten Ecken nach oben und
dockt seitlich an USB Boot an. Eine zweite Instanz verbindet USB Boot mit dem
Boot Manager. Die Lichtköpfe laufen nacheinander durch beide Verbindungen; danach bleiben die
vollständig verlegten blauen Kabel bestehen. Beim Kontrollwechsel ziehen sich
beide noch aktiven Leitungen geordnet zurück. Einen rückwärts laufenden
Suchstrom, fliegende Dateipakete oder kreuzende Leitungen gibt es nicht.

Die Quellmaße werden als unveränderliche Anchors weitergereicht. Hardware
veröffentlicht den SPI-Flash, UEFI den Boot Manager und Limine den Kernel Loader.
Keine nachfolgende Schicht dupliziert deren Position oder Größe in ihrer eigenen
Konfiguration.

Nach dem Verlegen ist die Energiephase nicht an den Scrollwert gekoppelt. Der
globale Render-Tick liefert eine fortlaufende Zeitphase an beide Kabel, sodass
die schmalen Energieringe auch bei ruhendem Scrollen dauerhaft vom Stick zum USB
Boot Service und weiter zum Boot Manager fließen. Bei reduzierter Bewegung wird
diese Phase auf null fixiert.

Beim Limine-Aufbau steigt der kompakte Footprint zunächst senkrecht über dem Boot
Manager auf, ohne seitlich zu wandern. Danach expandiert er über einen einmalig
aus Quellposition, Quellgröße und Zielgröße berechneten Skalier-Pivot. Dadurch
liegt die fertige Vollschicht bei Skalierung `1` automatisch exakt auf der
gemeinsamen X/Z-Achse des Systemstapels; eine nachträgliche Positionsanimation
ist nicht erforderlich. Kanten und Flächen besitzen getrennte Reveal-Werte:
Limine steigt zunächst als reiner Wireframe auf und beginnt seine Expansion
ebenfalls ohne Fläche. Erst im späteren Teil der Expansion wird das Material
langsam bis zur endgültigen Deckkraft eingeblendet.

Sobald `KERNEL LOADER` vollständig extrudiert ist, steigt direkt aus exakt
diesem Quellmaß eine kompakte `RUST KERNEL`-Ebene hoch und expandiert über den modularen
`expanding-stage-layer` auf das vollständige Systemmaß. Der Kernel besteht dabei
aus einer einzigen Fläche; die frühere 3×2-Blockmontage und alle Statussegmente
existieren nicht mehr. Auch fliegende Datenfragmente, Übergabekarten, Tür und
Kontrollimpuls werden nicht gerendert. Erst Wireframe, dann Fläche und
Seitentitel werden sichtbar.

Schichttitel liegen ausschließlich auf der zur Startkamera gerichteten
Seitenfläche. Dort ist nur der große, fette weiße Hauptbegriff sichtbar;
graue Erklärungszeilen werden nicht gerendert. Funktionale Karten dürfen eine
kleinere fachliche Unterzeile besitzen. Label-Canvas und Label-Geometrie teilen
immer dasselbe Seitenverhältnis; Text wird durch Font-Fitting statt durch
`fillText(..., maxWidth)` eingepasst. Expandierende Schichten kompensieren ihre
nicht-uniforme Elternskalierung für alle registrierten Labels, sodass Glyphen
weder während des Aufbaus noch im Endzustand gestaucht werden.

Die Limine-Schicht besitzt exakt zwei einzeilig beschriftete Funktionsobjekte:
`CONFIG` und `KERNEL LOADER`. Untertitel werden weder gerendert noch in den
Labeltexturen vorgehalten. Es steigen keine Signalströme und keine Datenpakete
aus UEFI oder Bare Metal zu diesen Chips auf. Nur der interne
Pfad von CONFIG zum Loader wird während seiner aktiven Phase sichtbar. Der
Handoff wird ruhig durch die Aktivierung des Kernels und den geordneten Rückzug
des Startgerüsts dargestellt, nicht durch zusätzliche fliegende Objekte.

Beim Rückzug bleiben die Energieringe in beiden UEFI-Kabeln aktiv. Die Kabel
werden vom Anfang her sichtbar kürzer, sodass der Strom bis zur wandernden
Kabelspitze läuft. Dieser Rückzug beginnt ohne Leerlauf direkt am Anfang des
Kontrollwechsels. Erst wenn die Leitungen vollständig eingezogen sind, folgt
Limine und anschließend leicht versetzt UEFI; ihre Rückzüge füllen den restlichen
Abschnitt kontinuierlich aus.

Der Seitentitel `LIMINE BOOT ENVIRONMENT` bleibt nach seinem Reveal während der
gesamten Limine-Sequenz sichtbar. Er dimmt nicht beim Erscheinen von CONFIG oder
KERNEL LOADER, sondern verschwindet erst beim eigenen Limine-Rückzug.

Seitentitel expandierender Schichten werden zwei Renderstufen nach ihrer
transparenten Oberfläche und mit zusätzlichem Abstand vor der Seitenfläche
gezeichnet. Dadurch bleibt insbesondere `RUST KERNEL` reinweiß und klar lesbar,
ohne durch das cyanfarbene Layer-Material abgedunkelt zu werden. Der Kernel
besitzt kein eigenes Point Light mehr; sein Laufzustand wird ausschließlich
über ein zurückhaltendes Material-Emissive gezeigt.

Alle Chipobjekte verwenden `objects/cards/create-info-card.js`. Das gemeinsame
Reveal zeichnet zuerst ausschließlich den flachen Footprint als fortlaufenden
Umriss auf die Oberfläche der Trägerschicht. Danach werden Seiten, Kanten und
Deckfläche bodenverankert nach oben extrudiert; das unverzerrte Label erscheint
erst im letzten Teil der Extrusion. Der SPI-Flash besitzt dafür keine eigene
Positionsanimation mehr; SPI, UEFI-Karten und Limine-Karten verwenden exakt
denselben Mechanismus. Ihre inaktive Grundfarbe stammt jeweils aus der
Konfiguration der Trägerschicht. Transparente Vorstufen schreiben keine Tiefe
und können deshalb kein schwarzes Loch in die Layerfläche stanzen.

Sprechertexte, Sound und Untertitel gehören später in eine eigene Medien- bzw.
Narrationsebene und werden nicht in 3D-Features hinterlegt.
