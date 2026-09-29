# NeoTurf Masters

**Clon espiritual arcade de golf 2.5D** — fiel al espíritu del mítico *Neo Turf Masters* (Nazca, Neo Geo, 1996).

Juego de 3 hoyos (Par 3/4/5) con 6 golfistas de racha, palos reales (1W→PT), sistema de *tres toques* (Power → Height → Impact), viento, efecto Magnus/hookslice, sweet spot de altura, red zone de riesgo, green con lectura de slope, water/out/cliff, minimap en HUD, y gráficos low-poly 3D + pixel-art billboards.

**Stack:** Three.js (web, CDN) · ES modules sin build · vanilla JS.

---

## Jugar

Abre `index.html` directo en el navegador (file:// funciona — no hay servidor necesario).

```
file:///ruta/absoluta/a/neoturf-masters/index.html
```

Si preferís un servidor local:

```bash
cd neoturf-masters
npx http-server .   # cualquier servidor static
```

## Controles

| Tecla | Acción |
|---|---|
| `1`–`6` | Elegir golfista (pantalla de selección) |
| `←` `→` | Apuntar |
| `↑` `↓` | Cambiar palo |
| `Z` | Hook (curva izquierda) |
| `X` | Slice (curva derecha) |
| `C` | Recto (anular curva) |
| `ESPACIO` | Iniciar → fijar potencia → fijar altura (o tirar si ya está fijado) |
| `R` | Auto-apuntar al pin |

También funciona **clic** en el canvas para los taps del meter.

---

## Qué hay dentro

```
neoturf-masters/
├── index.html          # entry point + UI (HUD, meter, hint)
└── src/
    ├── main.js         # estado global G, loop, input, audio synth
    ├── golfers.js      # 6 golfistas con stats (DRV/ACC/SKL/REC/PUT) + palettes + flags
    ├── holes.js        # 3 hoyos con par, pin, bunkers, water, cliffs, trees, green tilt
    ├── physics.js      # lieAt, slopeAt, onGreen, distToPin, autoClub, meter calibration
    ├── swing.js        # startSwing, tapMeter, swingClubA, impact (trigger)
    ├── shot.js         # doShot, doPutt, stepFlight, stepRoll, stepPutt, settle, nextHole
    ├── render.js       # Three.js scene, buildCourse, camera, syncScene, drawOverlay 2D
    └── sprites.js      # pixel-art generativo de golfistas (head/torso/legs por variantes)
```

## Física que replicá el arcade

- **Potencia**: barra que atraviesa tres veces (power → height → confirm). El sweet spot de altura depende de SKL.
- **Red zone**: si caés afuera del sweet spot de height, perdés el tiro (MISS +1) — calibrado por REC del golfista.
- **Hook/Slice**: ejes de curva lateral aplicados al impacto, con magnitud por potencia.
- **Vuelo**: parabólica con gravedad, efecto Magnus lateral, viento x/y que afecta trayectoria.
- **Aterrizaje**: rodadura por lie (rough frena mucho, green rueda + slope).
- **Putt**: cálculo de velocidad necesaria inverso (vv²=2·fr·d) + lectura de slope del green.

## Stats de los golfers

Cada golfista tiene 5 atributos 1–5 que afectan juego real:

| Stat | Efecto |
|---|---|
| DRV | Distancia base del drive |
| ACC | Error lateral del tiro (menos = mejor) |
| SKL | Sweet spot de altura (más = más tolerancia) |
| REC | Red zone más estrecha (más = más control) |
| PUT | Precisión del putt (más = más cómo) |

## Licencia

MIT — libre de usar, modificar y distribuir. Ver `LICENSE`.

---

Proyecto de Julio Cesar Machado · 2024 — código abierto para estudiar y extender.
