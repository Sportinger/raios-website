# raiOS Three.js film — narration handoff

The film uses one English narrator. Forward recordings are the source of truth;
reverse files are technical playback derivatives and do not need to be recorded.

## Available and integrated

Fourteen forward recordings and their generated or original reverse versions
now live under `src/assets/audio/`. Each cue is bound to its visual timeline
slot; the playback controller compensates for small duration differences.

| Timeline slot | File | Source duration | Spoken text |
| --- | --- | ---: | --- |
| 00:01.150–00:03.893 | `build-me-a-music-player.mp3` | 2.743 s | Build me a music player. |
| 00:04.443–00:08.283 | `kernel-layer.mp3` | 3.840 s | The base is a custom Rust kernel. |
| 00:08.833–00:12.594 | `genesis-layer.mp3` | 3.762 s | On top of that, we have the Genesis layer. |
| 00:12.594–00:24.715 | `agent-internet-key.mp3` | 12.121 s | Now we can spawn an agent. It gets granted access to the internet. The key that opens the door comes directly from the Genesis layer. |
| 00:24.915–00:38.786 | `builder-playground.mp3` | 13.871 s | The agent now requests a building playground. Once it is set up, the agent can create Rust code inside a safe environment. It also contains a Rust compiler and a guard. |
| 00:42.250–00:51.523 | `compiler-first-fail.mp3` | 9.273 s | The compiler compiles Rust into Wasm code. Or it does NOT. God dammit. Let's try that again. |
| 00:52.000–00:57.800 | `feedback-fix.mp3` | 7.602 s | The failure returns a precise report. The agent fixes the source and compiles again. |
| 00:57.800–01:09.800 | `shadow-rehearsal-fail.mp3` | 18.416 s | A disposable Shadow VM opens. A ghost copy receives only mocked input and files. The replay reaches only 653 of 654 claims. The frame hash mismatches. The test fails closed. |
| 01:09.800–01:20.200 | `twin-build-fix.mp3` | 9.378 s | The mismatch returns as a precise report. After the fix, two independent builds produce exactly the same bytes. |
| 01:20.200–01:48.000 | `shadow-acts.mp3` | 24.738 s | The corrected program repeats the claims test. This time, all 654 claims lock. Two fresh cells run the same test at the same time. Their divergence falls to zero across the comparison bridge. A third cell attacks every boundary. Seven attacks. Seven fail-closed walls. Only then does the tester hand over the proof. |
| 01:48.000–01:56.000 | `guard-bindings.mp3` | 7.367 s | The guard binds the compiler package and all three test seals. Owner approval opens the live door. |
| 01:56.000–02:04.000 | `live-release.mp3` | 7.288 s | The approved program leaves the Builder layer. Every disposable door, cable, and machine closes behind it. |
| 02:14.000–02:20.000 | `compact-domain.mp3` | 5.198 s | Now the complete player domain contracts into one private app island. |
| 02:20.000–02:28.000 | `archipelago.mp3` | 8.777 s | Every app receives its own isolated island: sixty apps, sixty boundaries, on one shared Rust kernel. |

## Still required from the narrator

Only one forward recording is missing:

| Timeline slot | Requested file | Target length | Script |
| --- | --- | ---: | --- |
| 02:04.000–02:14.000 | `running-isolation.mp3` | about 10.0 s | The player runs beside Genesis with only the space and rights it needs. A neighboring crash cannot cross its boundary. |

## Delivery format

- One clean file, preferably mono WAV, 48 kHz, 24-bit.
- No music, reverb, denoising tail, limiter pumping, or sound effects.
- Keep the narrator, microphone distance, gain, and room identical to the
  existing passages.
- Leave roughly 50–100 ms of clean room at both ends, but no long silence.
- Use the requested file name. MP3 is accepted when the original WAV is
  unavailable.

After delivery, its reverse version and cue can be added without changing the
film's visual timeline.
