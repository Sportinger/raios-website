# Power Link

`power-link` konfiguriert die wiederverwendbare Komposition
`connections/transient-signal-cable` entlang einer `CatmullRomCurve3`. Darin
leben gemeinsam:

- `connections/cable`: graue Leitung und fortschreitende Aktivierung
- `effects/energy-flow`: laufende Ringe im bereits aktivierten Abschnitt
- `effects/plasma-pulse`: dichte Impulswolke und lokales Punktlicht

Das Feature kennt keine Scrollposition. Sein einziger Laufzeitzustand wird über
`setState()` gesetzt:

```js
powerLink.setState({
  revealProgress: 1,
  signalProgress: 0.5,
  signalActive: true,
  flowProgress: 0.5,
  opacity: 1,
});
```

Form, Farbe, Geschwindigkeit und Effektwerte werden beim Erstellen über
`config` überschrieben. Kabel-, Ring- und Plasma-Lifecycle werden nicht mehr im
Feature dupliziert. Kapitel importieren das Feature ausschließlich über
`features/power-link/index.js`.
