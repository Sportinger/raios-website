# Power Link

`power-link` komponiert drei kapitelunabhängige Objekte entlang derselben
`CatmullRomCurve3`:

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
`config` überschrieben. Kapitel importieren das Feature ausschließlich über
`features/power-link/index.js`.
