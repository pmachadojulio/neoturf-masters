/* ============================================================
   NEO TURF MASTERS — main orquestador
   ============================================================ */
import * as THREE from 'three';
import { GOLFERS, CLUBS } from './golfers.js';
import { HOLES, HS, V3 } from './holes.js';
import { SPR, buildSprites } from './sprites.js';
import * as R from './render.js';   // render 3D + 2D overlay
import { startSwing, tapMeter, impact as onImpact } from './swing.js';
import {
  bindG as bindShot, doShot, doPutt, stepFlight, stepRoll, stepPutt,
  settle, nextHole, autoAimClub, land,
} from './shot.js';
import {
  bindG as bindPhys,
  lieAt, slopeAt, onGreen, fairwayCenterAt, distToPin,
  meterSpeed, powerCap, heightSweet, redZone, driveScale,
  holeLen, puttNeed, autoClub, golfKey,
} from './physics.js';

/** Estado global del juego */
const G = {
  screen: 'select',
  gi: 0,
  holeIndex: 0,
  stroke: 0,
  total: 0,
  holed: false,
  ball: { x: 0, y: 0, h: 0 },
  prev: { x: 0, y: 0 },
  lastSafe: { x: 0, y: 0 },
  aim: 0,
  clubIndex: 0,
  curve: 0,
  wind: { ang: 0.5, mph: 6 },
  meter: null,
  flight: null,
  roll: null,
  putt: null,
  swing: { stage: 'idle', t: 0, pending: null },
  banner: null,
  fade: 0,
  time: 0,
  AC: null,
};

// ---- bindear G a todos los módulos ----
bindShot(G);
bindPhys(G);
R.bindG(G);
R.SPR = SPR;

// ---- init render ----
R.initScene();
buildSprites();
G.aim = 0;
autoAimClub();

// ---- HUD ----
const hudHoleEl    = document.getElementById('hudHole');
const hudGolferEl  = document.getElementById('hudGolfer');
const hudWindEl    = document.getElementById('hudWind');
const hudStrokeEl  = document.getElementById('hudStroke');
const hudClubEl    = document.getElementById('hudClub');
const hudMsgEl     = document.getElementById('hudMsg');
const windArrowEl  = document.getElementById('windArrow');

function setMsg(m){ hudMsgEl.textContent = m; }

function updateHUD(){
  const h = HOLES[G.holeIndex];
  const g = GOLFERS[G.gi];
  const club = CLUBS[G.clubIndex];
  const names = ['1st', '2nd', '3rd'];
  hudHoleEl.textContent   = (names[G.holeIndex] || (G.holeIndex + 1) + 'th') + ' HOLE · PAR ' + h.par;
  hudGolferEl.textContent = g.name;
  hudWindEl.textContent   = G.wind.mph.toFixed(0) + ' mph';
  windArrowEl.style.transform = 'rotate(' + G.wind.ang + 'rad)';
  hudStrokeEl.textContent = G.stroke;
  const d = distToPin(G.ball.x, G.ball.y);
  hudClubEl.textContent = club.name + ' ' + (club.max * driveScale()).toFixed(0) + 'y ' + d.toFixed(0) + 'y ' + lieAt(G.ball.x, G.ball.y);
}

function holeLen(){
  const h = HOLES[G.holeIndex];
  return Math.hypot(h.tee.x - h.pin.x, h.tee.y - h.pin.y);
}

// ---- audio synth ----
function tone(f, dur, delay){
  try {
    G.AC = G.AC || new (window.AudioContext || window.webkitAudioContext)();
    const t = G.AC.currentTime + (delay || 0);
    const o = G.AC.createOscillator();
    const gn = G.AC.createGain();
    o.connect(gn);
    gn.connect(G.AC.destination);
    o.type = 'square';
    o.frequency.value = f;
    gn.gain.value = 0.05;
    o.start(t);
    o.stop(t + dur);
  } catch (e){ /* silent fail */ }
}

function snd(kind){
  if (kind === 'hit'){ tone(220, 0.08); tone(440, 0.1, 0.05); }
  else if (kind === 'nice'){ tone(660, 0.1); tone(880, 0.1, 0.1); tone(1320, 0.2, 0.2); }
  else if (kind === 'miss'){ tone(140, 0.25); }
  else if (kind === 'putt'){ tone(330, 0.07); }
  else if (kind === 'hole'){ tone(523, 0.12); tone(659, 0.12, 0.12); tone(784, 0.12, 0.24); tone(1046, 0.3, 0.36); }
}

// ---- scenes ----
function beginPlay(){
  G.screen = 'intro';
  const h = HOLES[G.holeIndex];
  G.ball  = { x: h.tee.x, y: h.tee.y, h: 0 };
  G.prev  = { x: h.tee.x, y: h.tee.y };
  G.lastSafe = { x: h.tee.x, y: h.tee.y };
  R.buildCourse();
  R.cutCamToBall();
  autoAimClub();
  updateHUD();
}

function shotHelpers(){
  // expone helpers en R para que swing.js las vea
  R.lieAt = lieAt;
  R.onGreen = onGreen;
  R.slopeAt = slopeAt;
  R.distToPin = distToPin;
  R.meterSpeed = meterSpeed;
  R.powerCap = powerCap;
  R.heightSweet = heightSweet;
  R.redZone = redZone;
  R.driveScale = driveScale;
  R.puttNeed = puttNeed;
  R.autoClub = autoClub;
  R.golfKey = golfKey;
  R.autoAimClub = autoAimClub;
  R.setMsg = setMsg;
  R.updateHUD = updateHUD;
  R.freezeCam = R.freezeCam;
  R.cutCamToBall = R.cutCamToBall;
  R.buildCourse = R.buildCourse;
  R.clubIndex = () => G.clubIndex;
  R.hole = () => HOLES[G.holeIndex];
  R.hero = () => GOLFERS[G.gi];
  R.SPR = SPR;
}

shotHelpers();

// ---- input ----
document.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (e.repeat && e.code !== 'ArrowLeft' && e.code !== 'ArrowRight') return;

  const k = e.code;
  if (G.screen === 'select'){
    if (k.indexOf('Digit') === 0){
      const n = +k.slice(5);
      if (n >= 1 && n <= 6){ G.gi = n - 1; beginPlay(); }
    } else if (k === 'Space' || k === 'Enter'){
      beginPlay();
    }
    return;
  }

  if (G.screen === 'intro'){
    if (k === 'Space' || k === 'Enter'){
      G.screen = 'play';
      R.cutCamToBall();
    }
    return;
  }

  if (k === 'ArrowLeft')  G.aim -= 0.028;
  else if (k === 'ArrowRight') G.aim += 0.028;
  else if (k === 'ArrowUp')   { G.clubIndex = Math.max(0, G.clubIndex - 1); updateHUD(); }
  else if (k === 'ArrowDown') { G.clubIndex = Math.min(7, G.clubIndex + 1); updateHUD(); }
  else if (k === 'KeyZ'){ G.curve = -1; setMsg('HOOK (B)'); }
  else if (k === 'KeyX'){ G.curve = 1;  setMsg('SLICE (C)'); }
  else if (k === 'KeyC'){ G.curve = 0;  setMsg('RECTO'); }
  else if (k === 'KeyR'){ autoAimClub(); }
  else if (k === 'Space'){
    if (G.holed){ nextHole(); return; }
    tapMeter(G);
  }
});

R.c2d.addEventListener('click', () => {
  if (G.screen === 'select') beginPlay();
  else if (G.screen === 'intro'){ G.screen = 'play'; R.cutCamToBall(); }
  else if (G.holed) nextHole();
  else tapMeter(G);
});

R.c2d.addEventListener('mousemove', (e) => {
  if (G.screen !== 'play' || G.meter || G.flight) return;
  G.aim += e.movementX * 0.0035;
});

// ---- loop ----
let last = performance.now();
function loop(now){
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  G.time += dt;

  if (G.banner){ G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }

  if (G.screen === 'play'){
    const sw = G.swing;
    if (sw.stage === 'back' && !G.meter) sw.stage = 'idle';
    if (sw.stage === 'top' && (!G.meter || G.meter.phase !== 'height')) sw.stage = 'idle';
    if (sw.stage === 'down' || sw.stage === 'pdown'){
      sw.t += dt;
      if (sw.t >= 0.15) onImpact(G);
    } else if (sw.stage === 'follow'){
      sw.t += dt;
      if (sw.t > 0.55 && !G.flight) sw.stage = 'idle';
    }

    if (G.meter){
      const sp = meterSpeed(G.meter.lie) * (G.meter.phase === 'power' ? 0.9 : 1.25);
      if (G.meter.phase === 'power'){
        G.meter.p += sp * dt * G.meter.dir;
        if (G.meter.p >= powerCap()){ G.meter.p = powerCap(); G.meter.dir = -1; }
        if (G.meter.p <= 0){ G.meter.p = 0; G.meter.dir = 1; }
      } else {
        G.meter.p += sp * dt * 1.4 * G.meter.dir;
        if (G.meter.p >= 1){ G.meter.p = 1; G.meter.dir = -1; }
        if (G.meter.p <= 0){ G.meter.p = 0; G.meter.dir = 1; }
      }
    }

    if (G.flight) stepFlight(dt);
    else if (G.roll) stepRoll(dt);
    else if (G.putt) stepPutt(dt);
  }

  R.syncScene(dt);
  R.renderer.render(R.scene, R.camera);
  R.drawOverlay();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
