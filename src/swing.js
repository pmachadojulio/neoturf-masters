/* ============================================================
   NEO TURF MASTERS — swing (power, height, impact)
   ============================================================ */
import { golfer, powerCap, heightSweet, redZone, lieAt } from './physics.js';

/** Inicio del swing: configurar meter y estado de swing */
export function startSwing(G){
  if (G.meter || G.flight || G.roll || G.putt || G.screen !== 'play' || G.swing.stage !== 'idle')
    return;

  const lie = lieAt(G.ball.x, G.ball.y);
  if (lie === 'water' || lie === 'cliff') return;

  G.meter = { phase:'power', p:0, dir:1, power:0, lie };
  G.swing = { stage:'back', t:0, pending:null };
  setMsg(lie === 'green' ? 'PUTTING: fija en la guía' : 'POWER!');
}

/** Tap del meter: avanza de fase */
export function tapMeter(G){
  if (G.swing.stage !== 'idle' && G.swing.stage !== 'back' && G.swing.stage !== 'top') return;

  const m = G.meter;
  if (!m) return startSwing(G);

  if (m.phase === 'power'){
    m.power = Math.min(m.p, powerCap());
    if (lieAt(G.ball.x, G.ball.y) === 'green'){
      G.meter = null;
      G.swing = { stage:'pdown', t:0, pending:{ power:m.power } };
      return;
    }
    m.phase = 'height';
    m.p = 0.5;
    m.dir = Math.random() < 0.5 ? -1 : 1;
    G.swing = { stage:'top', t:0, pending:null };
    setMsg('HEIGHT!');
  } else {
    G.meter = null;
    G.swing = { stage:'down', t:0, pending:{
      power:m.power, hPos:m.p, lie:m.lie, clubIndex:G.clubIndex,
      aim:G.aim, curve:G.curve,
    }};
  }
}

/** Ángulo del club a lo largo del swing (retro → top → down → follow) */
export function swingClubA(G){
  const s = G.swing;
  if (s.stage === 'back')    return -15 - 165 * (G.meter ? Math.min(1, G.meter.p) : 0);
  if (s.stage === 'top')    return -185 + Math.sin(performance.now() / 90) * 4;
  if (s.stage === 'down')   return -185 + 195 * Math.min(1, s.t / 0.13);
  if (s.stage === 'pdown')  { const k = Math.min(1, s.t / 0.15); return -15 + 30 * k - 50 * Math.max(0, k - 0.5); }
  if (s.stage === 'follow') return 10 + 125 * Math.min(1, s.t / 0.5 * 1.4);
  return -14 + Math.sin(performance.now() / 600) * 1.5;
}

/** Impacto: disparar putt o shot según pendiente */
export function impact(G){
  const s = G.swing;
  if (s.stage === 'pdown') doPutt(G, s.pending.power);
  else if (s.pending)       doShot(G, s.pending);
  G.swing = { stage:'follow', t:0, pending:null };
}

function setMsg(m){ document.getElementById('hudMsg').textContent = m; }
