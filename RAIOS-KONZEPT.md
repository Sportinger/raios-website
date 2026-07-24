# raiOS – Konzept aus Website und Three.js-Inszenierungen

> Agenten-Briefing, abgeleitet aus dem produktiven Website-Stand und dem
> experimentellen `three.js`-Branch. Analysierter Produktionsstand:
> `faf6f226925482923b9d4add747ae7e2cb50e043` vom 24. Juli 2026.

## Zweck und Leseregel

Dieses Dokument beschreibt das raiOS-Konzept so, wie es die öffentliche Website,
der live eingebettete Genesis-Film und das ältere Three.js-Boot-Experiment
erzählen. Es ist eine zusammengeführte Interpretation für weitere Agenten, keine
Kernel-Spezifikation.

Die wichtigste Leseregel lautet:

- Die Animation zeigt das beabsichtigte Systemmodell.
- Der Website-Text unterscheidet zwischen heute belegten Eigenschaften,
  experimentellen Zuständen und Zielbildern.
- Eine filmisch sichtbare Funktion ist für sich allein kein Beweis, dass sie im
  separaten `raios`-Repository bereits implementiert ist.
- Betriebssystem-, Kernel- und Hardware-Aussagen müssen vor technischer
  Weiterverwendung mit dem separaten
  [`raios`-Repository](https://github.com/Sportinger/raios) abgeglichen werden.

## Repository- und Branch-Lage

| Gegenstand | Bedeutung |
| --- | --- |
| Dieses Arbeitsverzeichnis | Checkout von `Sportinger/raios-website`, Branch `main` |
| `main` / `origin/main` | Produktive Website; der analysierte Stand war lokal, remote und live identisch |
| Live-Version beim Analysebeginn | `https://raios.tech/version.json` meldete `faf6f2269254` |
| Live-Three.js-Film | `ui-lab/site/three-film/`, in die Website auf `main` eingebettet |
| `origin/three.js` | Separates, experimentelles Power-on-/Boot-Scroll-Projekt; nicht die produktive Website |
| Betriebssystem-Code | Gehört ausschließlich in das separate `raios`-Repository |

Ein Push auf `main` deployt nur dann, wenn eine der im Workflow aufgelisteten
Website-, UI-Lab-, Worker- oder Build-Dateien geändert wurde. Eine reine
Markdown-Änderung bleibt im produktiven Branch dokumentiert, löst aber keinen
neuen Website-Deploy aus.

Die Hauptverwechslung, die Agenten vermeiden müssen:

1. Der produktive `main` enthält heute einen nativen Three.js-Film über die
   „Factory“, den Build- und Freigabeprozess.
2. Der Branch `three.js` enthält ein anderes, älteres Experiment über
   Einschalten, UEFI, Boot-USB, Limine und Kernel-Übergabe.

## Das Konzept in einem Satz

raiOS ist die Vision eines ruhigen, AI-nativen Einbenutzer-Betriebssystems auf
einem eigenen Rust-Kernel: Der Mensch formuliert ein Ziel, Agent und Builder
erzeugen Software direkt auf dem Gerät, eine Beweiskette prüft das exakte
Artefakt, der Besitzer erteilt die konkrete Freigabe, und jedes Programm läuft
anschließend in einer kleinen, widerrufbaren Wasm-Domäne mit ausschließlich den
benannten Fähigkeiten.

Die zentrale Dramaturgie lautet:

```text
Satz
  → Agent
  → explizite Fähigkeiten
  → isolierter Builder
  → reproduzierbares Artefakt
  → negative und deterministische Tests
  → gebundener Beweis
  → lokale Besitzerfreigabe
  → private Laufzeitdomäne
  → viele getrennte App-Inseln auf einem gemeinsamen Rust-Kernel
```

## Grundannahmen des Systems

### AI ist die Oberfläche

raiOS beginnt nicht bei Desktop, App-Raster und Dateimanager. Das System bootet
in eine Konversation. Programme entstehen aus Sätzen und werden nicht primär
von einem fremden App-Store oder einer externen Entwickler-Workstation
angeliefert.

Der Satz ist jedoch nur ein Auftrag. Er gewährt weder Rechte noch beweist er die
Korrektheit des Ergebnisses.

### Der Besitzer bleibt Root of Trust

Agenten dürfen lesen, analysieren, bauen und Vorschläge machen. Riskante oder
dauerhafte Wirkung entsteht erst durch eine vollständige Evidenzkette und eine
lokale, konkrete Freigabe des Besitzers. Ein Grant ist ein schmales,
aufgezeichnetes und widerrufbares Objekt.

Das Modell ist bewusst „one machine, one owner, many domains“ und nicht als
klassischer Mehrbenutzer-Desktop gedacht.

### Rechte sind Fähigkeiten, keine globalen Berechtigungen

Eine Fähigkeit wird in Website und Film als Schlüssel, Tür und Kabel
visualisiert. Das ist mehr als eine optische Metapher:

- Eine Domäne erhält nur explizit benannte Wasm-Imports.
- Ein Import kann etwa genau eine Framebuffer-Region, Eingabeereignisse oder
  genau eine Datei zugänglich machen.
- Für einen nicht gewährten Import existiert keine Tür in der ABI.
- „Nicht gewährt“ soll nicht nur eine spätere Prüfung auslösen, sondern bereits
  den möglichen Host-Effekt entfernen.
- Fähigkeiten sind einzeln erteilbar und wieder entziehbar.

Die Freigabe im Film bindet `PLAYER.WASM` an einen exakten Hash und genau drei
Fähigkeiten:

- `display · fb`
- `input · read`
- `file · dream.wav`

### Fehler verlieren nur ihre eigene Domäne

Der Rust-Kernel besitzt Hardware, native Treiber, MMU und Scheduler. Darüber
erzeugt die Genesis-Schicht getrennte Wasm-Domänen. Agent, Netzwerkdienst,
Diagnose, Builder und Apps sollen nicht denselben austauschbaren Fehlerraum
teilen.

Wenn ein Wasm-Service trappt, werden seine Imports entzogen und seine Instanz
ersetzt. Der Film fasst das als „a crash costs one block, never the house“
zusammen. Ein konkretes Subsekunden-SLA wird auf der Website ausdrücklich noch
nicht behauptet.

### Behauptungen öffnen keine Tür

Der Agent kann behaupten, dass ein Programm funktioniert. Der Guard akzeptiert
stattdessen nur gebundene Evidenz:

1. Manifest: Was kann und was verlangt das Programm?
2. Exakter Artefakt-Hash: Welche Bytes wurden tatsächlich geprüft?
3. Testberichte: Waren die vorgeschriebenen Prüfungen grün?
4. Rechteumfang: Welche konkrete Wirkung soll erlaubt werden?
5. Besitzerfreigabe: Wurde genau dieser Verbund lokal bestätigt?

Verschwindet ein Teil, schließt sich der Grant wieder. Die Website nennt keine
mathematische Verifikation; sie setzt bewusst auf Prädikate, Negativtests,
Berichte und Rollback.

## Schichten und Rollen

| Schicht oder Rolle | Aufgabe im dargestellten Modell |
| --- | --- |
| Hardware | Referenzgerät Surface Pro 4 und QEMU als definierte Zielplattformen |
| Rust-Kernel | MMU, Scheduler, native Treiber, Hardwarepfade, Vertrauen und Recovery |
| Genesis Layer | Erzeugt Domänen, prägt Capability-Schlüssel, bindet Imports und kann Domänen stoppen |
| Agent | Versteht den Satz, liest strukturiertes Systemwissen, recherchiert mit erteilter Netzfähigkeit und bearbeitet Quellcode |
| Net API | Eigene Wasm-Domäne zwischen Agent und nativem Netzwerkpfad |
| Builder Layer | Abgesperrter Arbeitsraum mit Quellbereich, Sysroot, Rust-Compiler, Tester und Guard |
| Compiler | Übersetzt Rust nach Wasm und liefert Fehler als strukturierte Rückmeldung |
| Tester / Shadow World | Führt deterministische, parallele und fail-closed Prüfungen in wegwerfbaren Zellen aus |
| Guard | Bindet Artefakt, Reports, Rechte und Besitzerfreigabe; öffnet erst dann `/out` |
| Player Domain | Private Live-Domäne für das freigegebene Programm mit nur den benötigten Türen |
| App-Archipel | Viele getrennte App-Inseln teilen den Kernel, aber nicht denselben privaten Raum |

Native Treiber bleiben nach dem aktuellen Website-Konzept bewusst im Kernel.
raiOS behauptet heute keine isolierten Treiber-Neustarts. Die harte
Austauschgrenze liegt oberhalb der Treiber bei Wasm-Services mit expliziten
Imports.

## Der produktive Genesis-Film

### Form

Der live eingebettete Film heißt „The Factory Moves In“. Seine fachliche
Animationszeit beträgt 148 Sekunden. Durch an echten Audiodateien ausgerichtete
Sprecher-Cues beträgt die vollständige Playback-Zeit rund 149,49 Sekunden.

Der Film ist zugleich:

- scrollgesteuerte Architektur-Erklärung,
- mit PLAY abspielbarer, vertonter Film,
- direkt anspringbare 14-Kapitel-Timeline,
- reversibel rekonstruierbarer Zustand,
- optional frei orbitierbare echte 3D-Szene.

Die Seite besitzt eine durchgehende Scrollstrecke. Der Website-Controller
übersetzt die Scrollposition in Playback-Zeit; der Film übersetzt Playback-Zeit
über Audio-Anker zurück in Animationszeit. Bei hörbarem PLAY wartet die Bewegung
an Cue-Grenzen auf das tatsächliche Audioende. Direktes Scrollen und Springen
bleiben dagegen deterministisch.

### Drei Akte

1. **Fundament und Befugnis:** Satz, Rust-Kernel, Genesis, Agent und
   Internet-Schlüssel.
2. **Die Fabrik:** Builder, Quellmaterial, Compiler-Feedback,
   Reproduzierbarkeit und Shadow-World-Tests.
3. **Vertrauen und Betrieb:** Guard, Besitzerfreigabe, Live-Domäne,
   Fehlerisolation und App-Archipel.

### Vollständiger Ablauf in 14 Kapiteln

Die Zeiten in der Tabelle sind fachliche Animationszeiten, nicht die leicht
gedehnte Audio-Playback-Zeit.

| Nr. | Zeit | Sichtbare Handlung | Konzeptaussage |
| ---: | ---: | --- | --- |
| 01 | 0–3,89 s | `> build me a music player` wird als einziger Satz geschrieben. | Ein Ziel startet den Prozess, ist aber noch kein Recht und kein Programm. |
| 02 | 3,89–12,59 s | Der `RUST-KERNEL` wird gezeichnet und aufgebaut; darüber entsteht der `GENESIS LAYER`. | Kleiner eigener Kernel unten, schmale Vertrauens- und Domänenschicht darüber. |
| 03 | 12,59–25 s | Die Welt weitet sich, ein `AGENT` erscheint, fragt nach Internet, Genesis prägt einen `net.https`-Schlüssel, die Tür öffnet sich und die Verbindung zum Netzturm entsteht. | Der Agent erhält Netzwerk nicht implizit, sondern durch einen konkret erzeugten Grant. |
| 04 | 25–33 s | Der Kernel wächst zur Builder-Fläche. `build.request`, `/sysroot`, `/src` und das versiegelte `/out` entstehen nacheinander; Schlüssel tragen `REQUEST`, `READ` und `READ/WRITE`. | Bauen findet in einem eigenen Raum mit engem Eingangsvertrag und zunächst geschlossenem Ausgang statt. |
| 05 | 33–41 s | `main.rs` und `Cargo.toml` laufen in den Builder und werden zu einem `PLAYER.RS`-Werkstück; „hashed · content-addressed · immutable“ erscheint. Compiler, Tester und Guard richten sich auf. | Aus verfolgtem Material wird ein eindeutig adressierbares Werkstück. |
| 06 | 41–52 s | Compiler-Runde 1 übersetzt Rust zu Wasm, scheitert sichtbar und stempelt einen präzisen roten Report. | Scheitern ist erwarteter strukturierter Input, kein verdeckter Ausnahmefall. |
| 07 | 52–71 s | Der Report geht zum Agenten zurück, der Quellcode wird korrigiert, Runde 2 kompiliert. Eine erste Shadow VM erhält nur Mock-I/O und Sandbox-Datei, erreicht aber lediglich 653 von 654 Claims; der Frame-Hash weicht ab und die Probe bleibt rot. | Auch ein kompilierbares Artefakt darf an einem reproduzierbaren Detail hart scheitern. |
| 08 | 71–81 s | Die zweite Diagnose führt zur nächsten Korrektur. Zwei unabhängige Builds A/B erzeugen anschließend bytegleiche Ausgabe; `PLAYER.RS` wird zu `PLAYER.WASM`. | Reproduzierbarkeit bindet nicht nur die Quelle, sondern die tatsächlich erzeugten Bytes. |
| 09 | 81–108 s | Drei Prüfakte laufen in wegwerfbaren Shadow-Zellen: 654/654 Claims, paralleler Lauf mit 0 % Divergenz und sieben gezielte fail-closed Angriffe. Am Ende verlässt nur ein Testzeugnis die Zelle. | Der Testbereich erhält Mock-Ressourcen; das Programm selbst oder Seiteneffekte dürfen die Testgrenze nicht verlassen. |
| 10 | 108–116 s | Test-Siegel und Compilerpaket wandern zum Guard. Eine Freigabekarte bindet Report, Hash und Rechte. Der Besitzer klickt lokal; ein entfernter Start wird ausdrücklich abgewiesen. | Vollständige Evidenz plus lokale Besitzerentscheidung erzeugt den Live-Grant. |
| 11 | 116–124 s | `/out` wird grün. Das genehmigte `PLAYER.WASM` verlässt den Builder und landet in einer neuen `PLAYER DOMAIN`; Builder-Türen, Kabel und Maschinen fahren herunter. | Die Bauumgebung wird nicht zur Laufzeitumgebung und behält keine offenen Nebentüren. |
| 12 | 124–134 s | Der Musikplayer läuft mit Framebuffer-, Eingabe- und Dateitür. Eine Nachbardomäne trappt, wird entfernt und frisch gestartet, während der Player weiterläuft. | Live-Software besitzt nur ihren privaten Raum; ein Nachbarfehler überschreitet die Grenze nicht. |
| 13 | 134–140 s | Die vollständige Player-Domäne zieht sich zu einer kleinen privaten App-Insel neben Genesis zusammen. | Die große Lehrdarstellung wird zum alltäglichen Laufzeitmodell: eine App, ein enger Raum. |
| 14 | 140–148 s | Sechzig weitere benannte App-Inseln wachsen auf derselben Rust-Kernel-Fläche. Das Finale sagt: „One app. One private island.“ | Viele Apps teilen Infrastruktur, aber nicht ihren privaten Wirkungsraum. |

### Die Shadow-World-Prüfung im Detail

Der Film zeigt nicht einen einzigen allgemeinen „Test bestanden“-Haken, sondern
drei verschiedenartige Beweise:

#### Test 1 – Claims

- Eine inerte Ghost Copy betritt eine disposable Shadow VM.
- Sie erhält ausschließlich `fb.mock`, `input.inject` und `file.sandbox`.
- Zuerst scheitert die Probe bei 653/654 Claims mit Frame-Hash-Mismatch.
- Nach Korrektur verriegeln alle 654 Claims.

#### Test 2 – parallele Deterministik

- Zwei frische Zellen führen denselben Test gleichzeitig aus.
- Eine Vergleichsbrücke misst ihre Abweichung.
- Der Lauf ist erst grün, wenn die Divergenz auf null fällt.

#### Test 3 – fail closed

Sieben konkrete Angriffe müssen an der Grenze scheitern:

| Test-ID | Angriff |
| --- | --- |
| `T-101` | `UNKNOWN IMPORT` |
| `T-102` | `PATH ESCAPE` |
| `T-103` | `FUEL EXHAUSTED` |
| `T-104` | `MEMORY.GROW DENIED` |
| `T-105` | `FORGED RECEIPT` |
| `T-106` | `BYTE TAMPER` |
| `T-107` | `REPLAY BLOCKED` |

„Rot“ ist in diesem Abschnitt das gewünschte Ergebnis: Der provozierte Angriff
muss rot enden, damit die Schutzwand als grün belegt gelten kann. Danach wird
die Ghost Copy beendet; nur der signierbare Bericht verlässt die Testzelle.

## Visuelle Grammatik

Die 3D-Inszenierung verwendet eine konsistente Sprache:

- **Schichten** sind dauerhafte Systemgrenzen.
- **Maschinen** sind klar benannte Rollen wie Compiler, Tester und Guard.
- **Türen** stehen für vorhandene ABI- und Capability-Pfade.
- **Schlüssel** stehen für explizit erzeugte Grants.
- **Kabel und Lichtpunkte** zeigen erlaubten Daten- oder Artefaktfluss.
- **Werkstücke** wechseln nachvollziehbar von Quelle über Rust-Werkstück zu
  Wasm-Artefakt.
- **Rote Stempel und Barrieren** bedeuten präzises, geschlossenes Scheitern.
- **Grüne Türen und Inseln** bedeuten gebundene Freigabe und laufende Isolation.
- **Wegwerfbare Keller/Zellen** trennen Testwirkung von Live-Wirkung.
- **Inseln** ersetzen am Ende die große Fabrikmetapher durch das skalierbare
  App-Modell.

Die Kamera beginnt bis Sekunde 13 in einer horizontalen, um 45 Grad versetzten
Seitenansicht auf Höhe des Rust-Kernels und fährt bis Sekunde 15,3 in die
isometrische Hauptansicht. Der gesamte am Kernel befestigte Verbund dreht sich
während des Films zunächst um 90 Grad und später um weitere 90 Grad. Foundation
und Factory bleiben dabei als ein zusammenhängender Aufbau am Kernel-Pivot
befestigt.

Im eingebetteten Film bleibt der Renderer transparent. Das Website-Raster liegt
hinter der Szene und scrollt mit der Seite; der eigenständige Film kann ein
eigenes Three.js-Raster anzeigen.

## Die Website-Erzählung um den Film

Der Film erklärt vor allem den Weg vom Satz zur isolierten App. Die nachfolgenden
Website-Abschnitte erweitern ihn um folgende Aussagen.

### Das System beschreibt sich strukturiert

Der erste Grant an einen Agenten ist Lesen. Statt PDFs und menschlich zu
interpretierender Logtexte soll er Protokollantworten erhalten:

- `system.snapshot`
- `device.graph`
- `problem.list`

Auch Ablehnung ist strukturierte Antwort. Ein Schreibversuch wie
`module.persist` ergibt `capability_denied` und benennt fehlende Evidenz.

### Die Risikoleiter startet bei Read-only

Die Website nennt sieben Klassen:

1. `READ`
2. `CHECK`
3. `SIMULATE`
4. `EXPORT`
5. `CHANGE RAM`
6. `PERSIST`
7. `HARDWARE`

Nur Lesen ist initial offen. Selbst mit vollständiger Evidenz wird eine weitere
Klasse einzeln, eng und widerrufbar freigegeben; es gibt keinen pauschalen
Agenten-Superuser.

### Die Agentenfabrik baut das System, ist aber nicht Teil des ausgelieferten OS

Die Website unterscheidet zwei Fabriken:

- Die Entwicklungsfabrik aus zehn parallelen Agenten-Lanes und einem
  Orchestrator baut raiOS selbst. Für den sensiblen Kernel sind höchstens zwei
  gleichzeitige Lanes vorgesehen.
- Der onboard Builder ist das für Besitzer gedachte, eingegrenzte
  Software-Werk. Agent und Builder sollen als erstes Programmpaar ausgeliefert
  werden und weitere Software erzeugen.

Beide folgen demselben Feedbackmuster:

```text
write → compile → read structured failure → fix
```

### „The factory moves in“

Der eigentliche Durchbruch des Konzepts ist nicht bloß AI-generierter Code.
Compiler, Tests, Beweisbindung, Freigabe und Installation sollen auf das Gerät
wandern. Jede fertiggestellte Systemkomponente verbessert den Bau der nächsten.
Das Ziel ist ein vollständiger lokaler Kreis:

```text
request → build → test → sign → install → request …
```

## Ehrliche Statusgrenzen der öffentlichen Website

Diese Tabelle gibt die Aussagen der Website wieder. Sie ersetzt keine Prüfung
des separaten OS-Repositories.

| Als heute bzw. experimentell dargestellt | Als offen oder Ziel dargestellt |
| --- | --- |
| QEMU-Pfad wird täglich belegt | Vollständig autonomer Overnight-Hardware-Loop |
| Surface Pro 4 bootet experimentell | Surface-WLAN-Assoziation und DHCP |
| Grafik und USB laufen auf realer Hardware | Breite Legacy-Hardware-Unterstützung |
| WLAN-Chip wird erkannt | Allgemeine WLAN-Nutzbarkeit auf dem Surface |
| Wasm-Out-of-bounds trappt als fester Negativtest | Aktive IOMMU-Translation und echte DMA-Isolation |
| Ungranteter Import fehlt und erzeugt keinen Host-Effekt | Fremde DMA-Angriffe als reale, isolierte Negativtests |
| VT-d-Struktur wird geprüft | Vollständige IOMMU-Grenze |
| Hash-gebundene RECLOG-Strukturen und Host-Berichte liefern Evidenz | Permanentes append-only Gerätejournal für jeden Record |
| Rollback, Prädikate und Negativtests sind der gewählte Ansatz | Mathematische Verifikation wird nicht behauptet |
| Native Treiber bleiben im Kernel | Isolierte Treiber-Neustarts |
| Wasm-Domäne kann ohne Systemneustart ersetzt werden | Belegtes Subsekunden-SLA |
| Builder-Crash bleibt als isoliertes Ereignis gedacht; sicherheitskritische Rechte sind für Builder-Domänen per Policy verboten | Vollständige onboard Build-, Test- und Promotion-Pipeline als auf Hardware belegter Produktpfad |
| Besitzerfreigabe ist Teil des Vertrauensmodells | Signierte reproduzierbare Builds und vollständiges Grant-Audit vor breiter Nutzung |
| Referenzziele sind QEMU und ein Surface Pro 4 | Kein Anspruch auf eine weltweite Hardware-Matrix |

Der geplante Overnight-Loop nennt drei ausdrücklich offene Bausteine:
Watchdog, Smart Plug und `ramoops`.

## Bewusste Nicht-Ziele

Die Website positioniert raiOS ausdrücklich nicht als:

- Linux- oder POSIX-System,
- Windows-Unterbau mit neuer Oberfläche,
- klassischen Mehrbenutzer-Desktop,
- Kompatibilitätsschicht für beliebige Legacy-Software,
- Betriebssystem für jede historische Hardwarekombination,
- mathematisch vollständig verifiziertes System.

Bekannte Ideen werden nicht als Neuerfindung verkauft. Capability Security,
Wasm-Isolation und evidenzbasierte Logs werden als bekannte Ansätze genannt,
die für dieses System in Rust neu zusammengesetzt werden. Die schmale
Foundation soll langfristig sogar austauschbar genug bleiben, dass etwa seL4
darunter treten könnte, ohne die höheren Verträge neu zu erfinden.

## Das separate Experiment auf `origin/three.js`

### Status und Abgrenzung

`origin/three.js` ist ein eigenständiges statisches Three.js-/Vite-Experiment
und nicht live auf `raios.tech`. Es erzählt nicht die Factory-Geschichte,
sondern den physischen Einschalt- und Bootpfad.

Die aktuelle Struktur dieses Branches liegt direkt unter `src/`. Der in
`main` dokumentierte Link zu `ui-lab/site/scroll-cube` entspricht daher nicht
mehr der tatsächlichen Branch-Struktur.

### Sein Storyboard

1. Ein physischer Power-Button wird sichtbar, gedrückt und wieder freigegeben.
2. Ein Plasma-/Energieimpuls läuft über ein sichtbares Kabel zum `BARE METAL`.
3. Die Hardwarefläche fährt hoch; der SPI-Flash wird sichtbar.
4. Die UEFI-Firmware wächst aus dem SPI-Flash zu einer vollständigen
   temporären Glasschicht.
5. Ein physischer Boot-USB-Stick wird eingesteckt.
6. Der Datenweg läuft von `USB Boot Service` zu `Boot Manager`.
7. Aus dem Boot Manager entsteht die temporäre Limine-Schicht mit `CONFIG` und
   `KERNEL LOADER`.
8. Aus dem Loader wächst der vollständige `RUST KERNEL`.
9. Beim Kontrollwechsel ziehen sich aktive UEFI-Kabel, Limine und UEFI geordnet
   zurück.
10. Der Rust-Kernel landet auf Bare Metal und bleibt als laufende Schicht
    bestehen; der SPI-Flash bleibt als inaktive Hardware erhalten.

Die sichtbaren Navigationsabschnitte heißen:

- Power on
- UEFI Firmware
- raiOS Boot USB
- Limine
- Kernel laden
- Kontrollwechsel
- Kernel landet

Dieses Experiment besitzt PBR- und umschaltbare flache Vektoransicht, freie
Orbit-Kamera, Scroll-/Autoplay-Steuerung und Reduced-Motion-Verhalten. Sprecher,
Audio und Untertitel sind dort ausdrücklich noch nicht Teil der Implementierung.

### Gemeinsame Aussage beider Three.js-Welten

Das Boot-Experiment erklärt, wie Kontrolle von physischer Hardware über
temporäre Bootschichten an den Rust-Kernel übergeht. Der produktive Factory-Film
setzt danach konzeptionell an und erklärt, wie derselbe Kernel Genesis,
Builder, Evidenz und private App-Domänen trägt.

Zusammengelesen entsteht:

```text
Power
  → Bare Metal
  → UEFI
  → Boot USB
  → Limine
  → Rust-Kernel
  → Genesis
  → Agent + Builder
  → geprüfte Wasm-App
  → private App-Insel
```

Die beiden Animationen sind dennoch getrennte Projekte und besitzen keine
gemeinsame produktive Timeline.

## Technische Quellenkarte für Agenten

| Quelle | Inhalt |
| --- | --- |
| [`raios-ui-lab.html`](raios-ui-lab.html) | Öffentliche Texte, Diagramme, Film-Host und erhaltene Legacy-SVG-Fassung |
| [`ui-lab/site/film.js`](ui-lab/site/film.js) | Zentraler Website-Controller, Scroll-/Playback-Kopplung und Legacy-Filmzustände |
| [`ui-lab/site/three-film/embedded-film.js`](ui-lab/site/three-film/embedded-film.js) | Shadow-DOM-Einbettung des produktiven Three.js-Films |
| [`ui-lab/site/three-film/src/film/film-data.js`](ui-lab/site/three-film/src/film/film-data.js) | 14 Kapitel, Kamera-Keyframes und fachliche Aktionszeiten |
| [`ui-lab/site/three-film/src/film/objects/foundation/`](ui-lab/site/three-film/src/film/objects/foundation/) | Kernel, Genesis, Agent, Capability-Schlüssel und Builder-Grundfläche |
| [`ui-lab/site/three-film/src/film/objects/factory/`](ui-lab/site/three-film/src/film/objects/factory/) | Compiler, Feedback, Tests, Guard, Live-Domäne und App-Archipel |
| [`ui-lab/site/three-film/src/film/presentation/`](ui-lab/site/three-film/src/film/presentation/) | Sprecher-Cues, Captions, Statusfenster und Audio-/Animations-Mapping |
| `origin/three.js:src/story/` | Gewichtete Scrollstory des experimentellen Boot-Films |
| `origin/three.js:src/chapters/` | Power-on- und Boot-Choreografie des Experiments |
| `origin/three.js:src/features/boot-sequence/` | Sechs deterministische Bootphasen des Experiments |

Die alte 2,5D-SVG-Fassung bleibt in `raios-ui-lab.html`, `story.css` und
`film.js` vorhanden, ist auf `main` über `data-film-engine="three"` jedoch vom
normalen Ablauf abgeklemmt. Sie ist Rückfallpfad, nicht die aktuell sichtbare
Produktionsinszenierung.

## Bindende Umsetzungsprinzipien der Filmarchitektur

- Ein Zeitpunkt muss immer denselben Zustand ergeben.
- Direktes Springen und Rückwärtsscrollen dürfen keine versteckte Historie
  benötigen.
- Fachliche Zustände bleiben zentral zeitgesteuert; Objektmodule erhalten nur
  den Zeitpunkt und leiten daraus ihren Zustand ab.
- Scrollposition und Audiowiedergabe dürfen die fachliche Reihenfolge nicht
  verändern.
- Reduced Motion zeigt einen stabilen späten Posterzustand, statt die komplette
  Bewegung zu erzwingen.
- Der eingebettete Film bleibt im Shadow DOM, damit Styles und IDs nicht mit
  Website oder UI Lab kollidieren.
- Foundation und Factory hängen an einem gemeinsamen Kernel-Transformträger.
- Die Website bleibt statisch und frameworkfrei.

## Gefundene Inkonsistenzen und offene Klärpunkte

### 60 Inseln versus 21 im Status-Overlay

Die aktive Archipel-Sequenz erzeugt 60 App-Definitionen, der Sprecher sagt
„sixty apps, sixty boundaries“, und das Timing verlangt `islandCount: 60`.
`FILM_STATUS_WINDOWS` zeigt im letzten Fenster dagegen noch
`21 ISOLATED APP ISLANDS`. Für inhaltliche Arbeit ist 60 der durch Animation,
Katalog und Sprecher mehrfach gestützte Wert; die 21 wirkt wie ein veralteter
Overlay-Text.

### Veralteter `scroll-cube`-Pfad

README und Agentenanweisung verlinken
`three.js/ui-lab/site/scroll-cube`. Der aktuelle Remote-Branch `three.js`
enthält das Projekt jedoch direkt auf Branch-Wurzelebene mit `src/`,
`index.html`, `package.json` und `vite.config.js`.

### Filmkonzept versus Implementierungsbeweis

Der Film zeigt unter anderem Compiler, drei Testsiegel, Guard-Bindung,
Besitzerfreigabe und 60 App-Inseln als geschlossene Erzählung. Neue Agenten
dürfen daraus keine Aussage wie „alle 60 Apps existieren“ oder „die vollständige
Trust-Pipeline läuft bereits auf Hardware“ ableiten. Solche Aussagen benötigen
Belege aus dem OS-Repository und dessen Tests.

## Arbeitsauftrag für nachfolgende Agenten

Bei weiterer Konsolidierung sollte jede neue Aussage einem dieser Typen
zugeordnet werden:

```text
VISION         – gewünschtes Endmodell
WEBSITE CLAIM  – öffentliche Aussage, noch nicht im OS-Repo geprüft
EXPERIMENTAL   – auf QEMU oder Referenzhardware teilweise gezeigt
PROVEN TODAY   – durch aktuellen Code und reproduzierbaren Test belegt
OPEN           – ausdrücklich noch nicht implementiert oder nicht bewiesen
NON-GOAL       – bewusst ausgeschlossen
```

Empfohlene Reihenfolge:

1. Dieses Dokument als Konzeptkarte verwenden.
2. Behauptungen mit dem separaten `raios`-Repository abgleichen.
3. Für jede technische Aussage den konkreten Test, Report oder Codepfad nennen.
4. Offene Ziele nicht sprachlich zu heutigen Eigenschaften hochstufen.
5. Website-Metaphern wie Schlüssel, Türen und Inseln in konkrete
   Capability-, ABI-, Domänen- und Evidenzverträge übersetzen.
6. Betriebssystemcode niemals in diesem Website-Repository ergänzen.
