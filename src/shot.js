/* ============================================================
   NEO TURF MASTERS — shot, putt, flight physics, roll
   ============================================================ */
import { CLUBS, GOLFERS } from './golfers.js';
import { HOLES, HS, V3 } from './holes.js';
import {
  d2, hole, holeLen, onGreen, onFringe, lieAt, slopeAt,
  distToPin, autoClub, driveScale, heightSweet, redZone,
  meterSpeed, golfer, golferX, golferY,
} from './physics.js';

/** Estado global (se inyecta desde main.js) */
let G;

/** Settea la referencia a G */
export function bindG(g){ G = g; }

const gv = () => GOLFERS[G.gi];
const cl = () => CLUBS[G.clubIndex];
const hl = () => HOLES[G.holeIndex];

/** Inicio del tiro: compute velocidad inicial, angulos, curve */
export function doShot(ps){
  const g = gv(), club = cl(), lie = ps.lie;

  const sw = heightSweet(), rz = redZone(lie);
  if (ps.hPos < rz || ps.hPos > 1 - rz){
    G.stroke++;
    setMsg('MISS! (+1)');
    updateHUD();
    snd('miss');
    return;
  }

  const off = Math.abs(ps.hPos - 0.5);
  const perfect = off < sw;

  const hFactor = 1.12 - (ps.hPos * 0.45);
  const errLat = (off - sw > 0 ? (off - sw) : 0) * 46 * (6 - g.acc) * 0.35
    * ((lie === 'fairway' || lie === 'tee') ? 1 : 1.8);
  const errDir = (ps.hPos > 0.5 ? 1 : -1);

  const effMax = club.max * driveScale();
  const liePow = { tee:1, fairway:1, green:1, fringe:0.92, rough:0.8, sand:0.65, shore:0.45 }[lie] || 1;

  const R = Math.min(effMax * 1.12, Math.max(4,
    effMax * ps.power * hFactor * liePow * (perfect ? 1.02 : 1 - (off * 0.25))));

  const th = club.loft * Math.PI / 180;
  const gv2 = 30; // gravity scaling
  const v0 = Math.sqrt(Math.max(1, R * gv2 / Math.max(0.12, Math.sin(2 * th))));

  G.prev = { x: G.ball.x, y: G.ball.y };
  G.lastSafe = { x: G.ball.x, y: G.ball.y };
  freezeCam();

  G.flight = {
    x: G.ball.x, y: G.ball.y, h: 0,
    vx: v0 * Math.cos(th) * Math.cos(ps.aim),
    vy: v0 * Math.cos(th) * Math.sin(ps.aim),
    vh: v0 * Math.sin(th),
    t: 0,
    curve: (ps.curve * 9 * (0.4 + ps.power)) + (perfect ? 0 : errDir * errLat * 0.12),
    wx: Math.cos(G.wind.ang) * G.wind.mph * 0.9,
    wy: Math.sin(G.wind.ang) * G.wind.mph * 0.9,
    trail: [],
    R,
    perfect,
  };

  G.stroke++;
  if (perfect){
    G.banner = { txt:'NICE SHOT!', t:1.4 };
    snd('nice');
  } else {
    setMsg(club.name + ' ' + R.toFixed(0) + 'y');
    snd('hit');
  }
  updateHUD();
}

export function setMsg(m){ document.getElementById('hudMsg').textContent = m; }
export function updateHUD(){ /* se implementa en main.js */ }

/** Putt: calcular velocidad y dirección con pendiente */
export function doPutt(power){
  const need = puttNeed();
  const g = gv();
  const errLat = (power - need) * 40 + (Math.random() - 0.5) * (6 - g.put) * 1.1;
  const a = G.aim + errLat * 0.004;
  let v = 4 + power * 20;
  if (lieAt(G.ball.x, G.ball.y) === 'fringe') v *= 0.85;

  G.prev = { x: G.ball.x, y: G.ball.y };
  G.putt = {
    x: G.ball.x, y: G.ball.y,
    vx: Math.cos(a) * v,
    vy: Math.sin(a) * v,
    t: 0,
  };
  G.stroke++;
  setMsg(power <= need * 1.15 && power >= need * 0.85 ? 'Buen toque' : 'A leer la caída');
  snd('putt');
  updateHUD();
}

/** Velocidad de putt necesaria según distancia y pendiente */
export function puttNeed(){
  const d = distToPin(G.ball.x, G.ball.y);
  const s = slopeAt(G.ball.x, G.ball.y);
  const along = Math.cos(G.aim) * s.x + Math.sin(G.aim) * s.y;
  const vNeed = Math.sqrt(Math.max(4, 2 * 12 * d * 1.12)); // inversión de dist = v²/2fr
  return Math.max(0.05, Math.min(1, ((vNeed - 4) / 20) - along * 0.10));
}

/** Paso de vuelo: simular física de bala con Magnus, viento, gravedad */
export function stepFlight(dt){
  const f = G.flight;
  if (!f) return;

  f.t += dt;
  for (let i = 0; i < 3; i++){
    const h = dt / 3;
    f.vy += f.curve * h * 0.55; // Magnus lateral
    f.x += (f.vx + f.wx) * h;
    f.y += (f.vy + f.wy) * h;
    f.vh -= 30 * h;                   // gravity
    f.h += f.vh * h;

    if (f.h <= 0){ f.h = 0; land(); return; }
  }
  f.trail.push({ x: f.x, y: f.y, h: f.h });
  if (f.trail.length > 70) f.trail.shift();

  G.ball.x = f.x;
  G.ball.y = f.y;
  G.ball.h = f.h;
}

/** Aterrizaje: calcular rodadura según lie */
export function land(){
  const f = G.flight;
  G.flight = null;

  const x = f.x, y = f.y, lie = lieAt(x, y);

  if (lie === 'water'){
    G.stroke++;
    G.ball = { x: G.lastSafe.x, y: G.lastSafe.y, h: 0 };
    G.fade = 1;
    setMsg('¡Al agua! +1');
    updateHUD();
    autoAimClub();
    return;
  }
  if (lie === 'cliff'){
    G.stroke++;
    G.ball = { x: G.lastSafe.x, y: G.lastSafe.y, h: 0 };
    G.fade = 1;
    setMsg('¡Al barranco! +1');
    updateHUD();
    autoAimClub();
    return;
  }
  if (x < -60 || x > hl().pin.x + 160 || Math.abs(y) > 240){
    G.stroke++;
    G.ball = { x: G.lastSafe.x, y: G.lastSafe.y, h: 0 };
    G.fade = 1;
    setMsg('¡Fuera! +1');
    updateHUD();
    autoAimClub();
    return;
  }

  const keep = lie === 'fairway' ? 0.2
    : lie === 'green' ? 0.18
    : lie === 'fringe' ? 0.15
    : lie === 'tee' ? 0.1
    : lie === 'rough' ? 0.03 : 0.0;

  const sp = Math.hypot(f.vx, f.vy) * 0.14 * keep;
  const a = Math.atan2(f.vy, f.vx);

  G.roll = { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp };
  G.ball.h = 0;
}

/** Paso de rodadura: fricción variable por lie + pendiente */
export function stepRoll(dt){
  const r = G.roll;
  if (!r) return;

  const lie = lieAt(r.x, r.y);
  const fr = lie === 'green' ? 10
    : lie === 'fringe' ? 14
    : lie === 'fairway' ? 22
    : lie === 'rough' ? 40
    : lie === 'sand' || lie === 'shore' ? 55 : 20;

  const s = slopeAt(r.x, r.y);
  r.vx += s.x * 18 * dt;
  r.vy += s.y * 18 * dt;

  const sp = Math.hypot(r.vx, r.vy);
  const dec = fr * dt;

  if (sp <= Math.max(0.6, dec)){
    G.roll = null;
    G.ball.x = r.x;
    G.ball.y = r.y;
    settle();
    return;
  }
  r.vx -= r.vx / sp * dec;
  r.vy -= r.vy / sp * dec;
  r.x += r.vx * dt;
  r.y += r.vy * dt;

  const l2 = lieAt(r.x, r.y);
  if (l2 === 'water' || l2 === 'cliff'){
    G.stroke++;
    G.roll = null;
    G.ball = { x: G.lastSafe.x, y: G.lastSafe.y, h: 0 };
    G.fade = 1;
    setMsg(l2 === 'water' ? '¡Al agua! +1' : '¡Al barranco! +1');
    updateHUD();
  }
  G.ball.x = r.x;
  G.ball.y = r.y;
}

/** Paso de putt: rodar con fricción + pendiente */
export function stepPutt(dt){
  const p = G.putt;
  if (!p) return;

  const s = slopeAt(p.x, p.y);
  p.vx += s.x * 10 * dt;
  p.vy += s.y * 10 * dt;

  const fr = 12 * dt;
  const sp = Math.hypot(p.vx, p.vy);
  if (sp <= Math.max(0.4, fr)){
    G.putt = null;
    G.ball.x = p.x;
    G.ball.y = p.y;
    settle();
    return;
  }
  p.vx -= p.vx / sp * fr;
  p.vy -= p.vy / sp * fr;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  G.ball.x = p.x;
  G.ball.y = p.y;
}

/** Verificar embocadura */
export function settle(){
  const d = distToPin(G.ball.x, G.ball.y);
  if (d < 1.4){
    G.total += G.stroke;
    G.holed = true;
    const rel = G.stroke - hl().par;
    G.banner = {
      txt: rel <= -2 ? 'EAGLE!'
        : rel === -1 ? 'BIRDIE!'
        : rel === 0 ? 'PAR!'
        : 'BOGEY +' + rel,
      t: 2.2,
    };
    setMsg('¡En ' + G.stroke + '! ESPACIO');
    updateHUD();
    snd('hole');
    return;
  }
  cutCamToBall();
  G.fade = 1;
  autoAimClub();
}

/** Elegir palo automático y apuntar al pin */
export function autoAimClub(){
  const h = hl();
  G.aim = Math.atan2(h.pin.y - G.ball.y, h.pin.x - G.ball.x);
  G.clubIndex = autoClub();
  G.curve = 0;
  updateHUD();
}

/** Pasar al siguiente hoyo (loop de 3) */
export function nextHole(){
  G.holeIndex = (G.holeIndex + 1) % HOLES.length;
  G.stroke = 0;
  G.holed = false;
  const h = hl();
  G.ball = { x: h.tee.x, y: h.tee.y, h: 0 };
  G.prev = { x: h.tee.x, y: h.tee.y };
  G.lastSafe = { x: h.tee.x, y: h.tee.y };
  G.wind = { ang: Math.random() * Math.PI * 2, mph: 2 + Math.random() * 11 };
  buildCourse();
  cutCamToBall();
  G.fade = 1;
  G.screen = 'intro';
}

/** Sonido synth */
function snd(kind){
  /* implementado en main.js */
}

/** Cámara: congelar durante vuelo */
export function freezeCam(){ /* implementado en main.js */ }

/** Cámara: recorte a la bola */
export function cutCamToBall(){ /* implementado en main.js */ }

/** Construir el curso 3D actual */
export function buildCourse(){ /* implementado en main.js */ }
