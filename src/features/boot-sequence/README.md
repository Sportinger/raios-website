# Boot Sequence

Die Boot-Sequenz ist ein einziger langlebiger 3D-Objektgraph für die sichtbaren
Szenen 2 bis 9. Das Kapitel übersetzt seinen lokalen Scrollwert in `sceneIndex`
und `progress`; das Feature setzt daraus sämtliche vorherigen Phasen auf `1`,
die aktuelle Phase auf `progress` und alle späteren Phasen auf `0`.

Dieser Vertrag macht Direktansprünge, Rückwärtsscrollen, Reduced Motion und HMR
deterministisch. Die einzelnen Darsteller kennen weder Scrollpositionen noch
Kapitelnummern. Neue Phasen werden in `config.js` registriert und in
`create-boot-sequence.js` auf semantische Feature-Zustände abgebildet.

Sprechertexte, Sound und Untertitel gehören später in eine eigene Medien- bzw.
Narrationsebene und werden nicht in 3D-Features hinterlegt.
