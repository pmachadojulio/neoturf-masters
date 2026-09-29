/* ============================================================
   NEO TURF MASTERS — física, lie, clubs, swing, shot
   ============================================================ */

import { GOLFERS, CLUBS } from './golfers.js';
import { HOLES, HS, V3 } from './holes.js';

/** Distancia euclídea entre dos puntos (x,y) */
export const d2 = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);

/** Devuelve true si (x,y) está dentro de la elipse e */
export const inEllipse = (x, y, e) => ((x - e.x) / e.rx) ** 2 + ((y - e.y) / e.ry) ** 2 < 1;

/** Longitud del hoyo actual (tee → pin) en yardas */
export function holeLen(){
  const h = HOLES[0]; // placeholder: se usa con G.holeIndex desde game.js
  const h2 = (typeof window !== 'undefined' && window.__G_)? hole(): h;
  return d2(h2.tee.x, h2.tee.y, h2.pin.x, h2.pin.y);
}

/** Centro del fairway a una distancia wx desde el tee */
export function fairwayCenterAt(wx){
  const h = (window && window.__G_)? hole(): HOLES[0];
  const t = Math.max(0, Math.min(1, (wx - h.tee.x) / ((h.pin.x - h.tee.x) || 1)));
  return { y: h.tee.y + (h.pin.y - h.tee.y) * t, t };
}

/** Devuelve el hoyo actual */
export function hole(){
  // se injecta desde game.js: window.__G_.holeIndex
  const idx = (window && window.__G_)? window.__G_.holeIndex: 0;
  return HOLES[idx];
}

/** Devuelve el golfista actual */
export function golfer(){
  const idx = (window && window.__G_)? window.__G_.gi: 0;
  return GOLFERS[idx];
}

/** ¿Está (x,y) dentro del green del hoyo actual? */
export function onGreen(x, y){
  const h = hole();
  return ((x - h.pin.x) / h.green.rx) ** 2 + ((y - h.pin.y) / h.green.ry) ** 2 < 1;
}

/** ¿Está (x,y) dentro del fringe del hoyo actual? */
export function onFringe(x, y){
  const h = hole();
  const nd = ((x - h.pin.x) / h.green.rx) ** 2 + ((y - h.pin.y) / h.green.ry) ** 2;
  return nd >= 1 && nd < 1.8;
}

/** Lie del terreno en (x,y). Devuelve: 'tee','fairway','rough','sand','water','shore','fringe','green','cliff' */
export function lieAt(x, y){
  const h = hole();

  if (d2(x, y, h.tee.x, h.tee.y) < 4) return 'tee';

  for (const c of (h.cliffs || [])) if (inEllipse(x, y, c)) return 'cliff';
  for (const b of h.bunkers)      if (inEllipse(x, y, b)) return 'sand';
  for (const w of h.water)        if (inEllipse(x, y, w)) return 'water';
  for (const w of h.water)        if (inEllipse(x, y, { x: w.x, y: w.y, rx: w.rx * 1.35, ry: w.ry * 1.35 })) return 'shore';

  if (onGreen(x, y))   return 'green';
  if (onFringe(x, y))  return 'fringe';

  const c = fairwayCenterAt(x);
  if (Math.abs(y - c.y) < h.fairwayW / 2 && x > h.tee.x - 10 && x < h.pin.x + 30) return 'fairway';
  return 'rough';
}

/** Pendiente del green en (x,y). Fuera del green devuelve {x:0,y:0} */
export function slopeAt(x, y){
  if (!onGreen(x, y)) return { x: 0, y: 0 };
  const t = hole().green.tilt;
  return { x: t.x * 0.9, y: t.y * 0.9 };
}

/** Distancia al pin (x,y) → (hole.x, hole.y) */
export function distToPin(x, y){
  const h = hole();
  return d2(x, y, h.pin.x, h.pin.y);
}

/** Pelo actual — define velocidad del meter */
export function meterSpeed(lie){
  const g = golfer();
  return (1.55 - g.acc * 0.17) * (lie === 'fairway' || lie === 'tee' ? 1
    : lie === 'green' ? 0.85
    : lie === 'fringe' ? 1.2
    : lie === 'rough' ? 1.45
    : lie === 'shore' ? 2.2 : 1.8);
}

/** Sweet spot fracción para altura (mientras más SKL, más tolerancia) */
export function heightSweet(){
  return 0.09 + golfer().skl * 0.028;
}

/** Red zone fracción (amarrilla = zona de riesgo de toque malo) */
export function redZone(lie){
  const g = golfer();
  return Math.max(0.01,
    (lie === 'shore' ? 0.42
    : lie === 'sand' ? 0.30
    : lie === 'rough' ? 0.17
    : lie === 'fringe' ? 0.08
    : 0.055) - g.rec * 0.028);
}

/** Factor de drive por habilidad del golfista */
export function driveScale(){
  const g = golfer();
  return 0.86 + g.drv * 0.04;
}

/** Potencia máxima relativa (1.0 por defecto, >1 para drv alto) */
export function powerCap(){
  const g = golfer();
  return g.drv >= 5 ? 1.14 : g.drv >= 4 ? 1.06 : 1.0;
}

/** Elegir palo automático según distancia al pin */
export function autoClub(){
  const d = distToPin(golferX(), golferY());
  if (onGreen(golferX(), golferY())) return 7; // PUTTER
  for (const i of [0, 1, 2, 3, 4, 5, 6])
    if (d <= CLUBS[i].max * driveScale() * 1.02) return i;
  return 0; // 1W si nada encaja
}

/** Posición actual de la bola — compat con G.ball */
export function golferX(){ return (window && window.__G_)? window.__G_.ball.x: 0; }
export function golferY(){ return (window && window.__G_)? window.__G_.ball.y: 0; }

/** ¿Está la bola en green (para decide entre putt y shot)? */
export function isOnGreen(){
  return lieAt(golferX(), golferY()) === 'green';
}
