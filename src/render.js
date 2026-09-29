/* ============================================================
   NEO TURF MASTERS — render 3D (Three.js) + 2D overlay (Canvas)
   ============================================================ */
import * as THREE from 'three';
import { HOLES, HS, V3 } from './holes.js';
import { CLUBS, GOLFERS, FLAGS, FCOL, palFor } from './golfers.js';
import { SPR } from './sprites.js';

let G;
export function bindG(g){ G = g; }

export let renderer, scene, camera;
export let courseGroup;
export let ballMesh, shadowMesh, trailLine;
export let golferSprite, golferTex, golferCanvas;
export let aimLine, aimRing;
export let waterMats = [];
export let cloudGroup, flagPennant;
export let slopeArrows = [];
export let greenTex, sandTex, waterTex, rockTex;

let lastGolfKey = '';
let c2d;

// ----- init -----
export function initScene(){
  const c3d = document.getElementById('c3d');
  c2d = document.getElementById('c2d');

  renderer = new THREE.WebGLRenderer({ canvas: c3d, antialias: false });
  renderer.setSize(480, 270, false);
  renderer.setClearColor(0x79b8e8);

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x9fd0ee, 160, 640);

  camera = new THREE.PerspectiveCamera(30, 480 / 270, 0.5, 2000);

  scene.add(new THREE.HemisphereLight(0xbfe3ff, 0x2d7a3d, 0.95));
  const sun = new THREE.DirectionalLight(0xfff6d8, 1.6);
  sun.position.set(60, 110, 40);
  scene.add(sun);

  buildBaseGround();
  buildMountainsAndClouds();

  ballMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 })
  );
  scene.add(ballMesh);

  shadowMesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })
  );
  shadowMesh.rotation.x = -Math.PI / 2;
  scene.add(shadowMesh);

  trailLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 })
  );
  trailLine.frustumCulled = false;
  scene.add(trailLine);

  golferCanvas = document.createElement('canvas');
  golferCanvas.width = golferCanvas.height = 72;
  golferTex = new THREE.CanvasTexture(golferCanvas);
  golferTex.magFilter = THREE.NearestFilter;
  golferSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: golferTex, transparent: true }));
  golferSprite.scale.set(3.4, 3.4, 1);
  scene.add(golferSprite);

  aimLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 1.4, gapSize: 1.1 })
  );
  aimLine.frustumCulled = false;
  scene.add(aimLine);

  aimRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.1, 0.14, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xffeb3b })
  );
  aimRing.rotation.x = -Math.PI / 2;
  scene.add(aimRing);

  greenTex = canvasTex((ctx, w, h) => {
    ctx.fillStyle = '#5fd46e'; ctx.fillRect(0, 0, w, h);
    for (let r = 4; r >= 1; r--){
      ctx.fillStyle = r % 2 ? '#5fd46e' : '#4fc05c';
      ctx.beginPath(); ctx.arc(w / 2, h / 2, r * w / 8, r * w / 8, 0, 7); ctx.fill();
    }
    for (let i = 0; i < 300; i++){
      ctx.fillStyle = Math.random() < 0.5 ? '#54c75f' : '#6ce07c';
      ctx.fillRect(Math.random() * w | 0, Math.random() * h | 0, 1, 1);
    }
  });
  sandTex = canvasTex((ctx, w, h) => {
    ctx.fillStyle = '#ecd88f'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d9bd6a'; ctx.lineWidth = 2;
    for (let l = -h; l < h; l += 8){
      ctx.beginPath(); ctx.moveTo(0, l); ctx.lineTo(w, l + 10); ctx.stroke();
    }
  });
  waterTex = canvasTex((ctx, w, h) => {
    ctx.fillStyle = '#2f9fd8'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7ccff5';
    for (let k = 0; k < 5; k++)
      for (let i = 0; i < 6; i++)
        ctx.fillRect(i * 22 + (k * 13) % 22, k * 26, 12, 3);
  });
  waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
  rockTex = canvasTex((ctx, w, h) => {
    ctx.fillStyle = '#6b5a4a'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++){
      ctx.fillStyle = ['#574738', '#7a6752', '#4a3d30'][i % 3];
      ctx.fillRect(Math.random() * w | 0, Math.random() * h | 0, 3, 2);
    }
    ctx.strokeStyle = '#3d3227'; ctx.lineWidth = 3;
    for (let l = 0; l < h; l += 14){
      ctx.beginPath(); ctx.moveTo(0, l); ctx.lineTo(w, l + 5); ctx.stroke();
    }
  });
}

function buildBaseGround(){
  const gc = document.createElement('canvas');
  gc.width = gc.height = 128;
  const gx = gc.getContext('2d');
  gx.fillStyle = '#2f8f3e'; gx.fillRect(0, 0, 128, 128);
  gx.fillStyle = '#2a8238';
  for (let r = 0; r < 64; r++)
    for (let q = 0; q < 64; q++)
      if ((r + q) % 2 === 0) gx.fillRect(q * 2, r * 2, 2, 2);
  for (let i = 0; i < 500; i++){
    gx.fillStyle = Math.random() < 0.5 ? '#256b32' : '#3aa34c';
    gx.fillRect(Math.random() * 128 | 0, Math.random() * 128 | 0, 2, 1);
  }
  const gt = new THREE.CanvasTexture(gc);
  gt.wrapS = gt.wrapT = THREE.RepeatWrapping;
  gt.repeat.set(10, 16);
  gt.magFilter = THREE.NearestFilter;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(360, 700),
    new THREE.MeshLambertMaterial({ map: gt })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.06, -280);
  scene.add(ground);
}

function buildMountainsAndClouds(){
  const mg = new THREE.Group();
  const mmat = new THREE.MeshLambertMaterial({ color: 0x4a7ab5, flatShading: true });
  const smat = new THREE.MeshLambertMaterial({ color: 0xe8f4ff, flatShading: true });
  [[-160, -640, 90], [40, -680, 120], [220, -630, 80], [-40, -700, 140]].forEach(m => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(m[2], m[2] * 0.9, 5), mmat);
    cone.position.set(m[0], m[2] * 0.45 - 4, m[1]);
    mg.add(cone);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(m[2] * 0.35, m[2] * 0.32, 5), smat);
    cap.position.set(m[0], m[2] * 0.9 - 4 - m[2] * 0.16, m[1]);
    mg.add(cap);
  });
  scene.add(mg);

  cloudGroup = new THREE.Group();
  const cmat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
  for (let i = 0; i < 7; i++){
    const cl = new THREE.Group();
    for (let k = 0; k < 3; k++){
      const s = new THREE.Mesh(new THREE.SphereGeometry(6 + Math.random() * 5, 7, 6), cmat);
      s.scale.y = 0.45;
      s.position.set(k * 9 - 9, Math.random() * 2, Math.random() * 4);
      cl.add(s);
    }
    cl.position.set(-220 + Math.random() * 440, 62 + Math.random() * 30, -420 - Math.random() * 150);
    cloudGroup.add(cl);
  }
  scene.add(cloudGroup);
}

function canvasTex(draw, w, h){
  const c = document.createElement('canvas');
  c.width = w || 128;
  c.height = h || 128;
  draw(c.getContext('2d'), c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  return t;
}

// ----- curso 3D -----
export function buildCourse(){
  if (courseGroup) scene.remove(courseGroup);
  waterMats = [];
  slopeArrows = [];
  courseGroup = new THREE.Group();
  scene.add(courseGroup);

  const h = HOLES[G.holeIndex];
  const lam = (c) => new THREE.MeshLambertMaterial({ color: c });

  // fairway ribbon
  {
    const x0 = h.tee.x - 20, x1 = h.pin.x + 40, n = 26;
    const pos = [], col = [], idx = [];
    const cA = new THREE.Color('#57c465'), cB = new THREE.Color('#49b354');
    for (let i = 0; i <= n; i++){
      const wx = x0 + (x1 - x0) * i / n;
      const c = fairwayCenterAt(wx);
      const hw = h.fairwayW / 2;
      pos.push(c.y - hw, 0, -wx, c.y + hw, 0, -wx);
      const cc = i % 2 ? cA : cB;
      col.push(cc.r, cc.g, cc.b, cc.r, cc.g, cc.b);
      if (i < n){ const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    courseGroup.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })));
  }

  const disc = (wx, wy, rx, ry, y, mat) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 28), mat);
    m.rotation.x = -Math.PI / 2;
    m.scale.set(rx, ry, 1);
    m.position.set(wy, y, -wx);
    courseGroup.add(m);
    return m;
  };

  disc(h.pin.x, h.pin.y, h.green.rx * 1.28, h.green.ry * 1.32, 0.008, lam('#8be08b'));
  disc(h.pin.x, h.pin.y, h.green.rx, h.green.ry, 0.016, new THREE.MeshLambertMaterial({ map: greenTex }));
  disc(h.pin.x, h.pin.y, 0.9, 0.9, 0.024, new THREE.MeshBasicMaterial({ color: 0x0d0d0d }));

  for (const b of h.bunkers)
    disc(b.x, b.y, b.rx, b.ry, 0.012, new THREE.MeshLambertMaterial({ map: sandTex }));

  for (const w of h.water){
    const wm = new THREE.MeshLambertMaterial({ map: waterTex.clone(), transparent: true, opacity: 0.92 });
    wm.map.needsUpdate = true;
    wm.map.wrapS = wm.map.wrapT = THREE.RepeatWrapping;
    waterMats.push(wm);
    disc(w.x, w.y, w.rx, w.ry, 0.02, wm);
  }

  for (const w of h.water)
    disc(w.x, w.y, w.rx * 1.35, w.ry * 1.35, 0.010, new THREE.MeshLambertMaterial({ color: 0xcbb26a }));

  for (const c of (h.cliffs || []))
    disc(c.x, c.y, c.rx, c.ry, 0.006, new THREE.MeshLambertMaterial({ map: rockTex }));

  // postes OB
  {
    const obM = new THREE.MeshBasicMaterial({ color: 0xf4f4f4 });
    const yEdge = h.fairwayW / 2 + 55;
    for (let wx = h.tee.x - 10; wx < h.pin.x + 30; wx += 15){
      for (const s of [-1, 1]){
        const c = fairwayCenterAt(wx);
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.8, 0.35), obM);
        post.position.set(c.y + s * yEdge, 0.9, -wx);
        courseGroup.add(post);
      }
    }
  }

  // árboles
  const trunkM = lam('#5b3a1e');
  const pineM  = new THREE.MeshLambertMaterial({ color: 0x1d6b2a, flatShading: true });
  const pineM2 = new THREE.MeshLambertMaterial({ color: 0x2f9e44, flatShading: true });
  const oakM   = new THREE.MeshLambertMaterial({ color: 0x2f8f3e, flatShading: true });
  const palmM  = new THREE.MeshLambertMaterial({ color: 0x6b4a22, flatShading: true });

  for (const t of h.trees){
    const g = new THREE.Group();
    const s = 0.9 + ((t.x * 7 + t.y * 13) % 10) / 14;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5 * s, 0.7 * s, 3 * s, 6),
      t.t === 'palm' ? palmM : trunkM
    );
    trunk.position.y = 1.5 * s;
    g.add(trunk);

    if (t.t === 'pine'){
      for (let i = 0; i < 3; i++){
        const cone = new THREE.Mesh(new THREE.ConeGeometry((4.4 - i * 1.1) * s, 3.4 * s, 7), i % 2 ? pineM2 : pineM);
        cone.position.y = (3.4 + i * 2.2) * s;
        g.add(cone);
      }
    } else if (t.t === 'oak'){
      const b1 = new THREE.Mesh(new THREE.IcosahedronGeometry(3.4 * s, 0), oakM);
      b1.position.y = 5.4 * s; g.add(b1);
      const b2 = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2 * s, 0), pineM2);
      b2.position.set(1.8 * s, 4.2 * s, 1 * s); g.add(b2);
    } else {
      trunk.rotation.z = 0.18;
      trunk.position.x = 0.5 * s;
      for (let i = 0; i < 5; i++){
        const f = new THREE.Mesh(new THREE.ConeGeometry(0.7 * s, 4.6 * s, 4), pineM2);
        const a = -2.4 + i * 0.55;
        f.position.set(1 + i * 0.28, 6.4 * s + Math.sin(a) * 1.2, Math.cos(a * 1.3) * 1.4);
        f.rotation.z = -Math.PI / 2 + a * 0.4;
        g.add(f);
      }
    }
    g.position.set(t.y, 0, -t.x);
    courseGroup.add(g);
  }

  // bandera
  {
    const p = V3(h.pin.x, h.pin.y, 0);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 7, 6), new THREE.MeshBasicMaterial({ color: 0xf4f4f4 }));
    pole.position.set(p.x, 3.5, p.z);
    courseGroup.add(pole);
    const sh = new THREE.Shape();
    sh.moveTo(0, 0); sh.lineTo(3.4, 0.8); sh.lineTo(0, 1.7); sh.closePath();
    flagPennant = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: 0xe53935, side: THREE.DoubleSide }));
    flagPennant.position.set(p.x, 5.4, p.z);
    courseGroup.add(flagPennant);
  }

  // cartel tee
  {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 40;
    const x = c.getContext('2d');
    x.fillStyle = '#8b5a2b'; x.fillRect(0, 0, 64, 40);
    x.strokeStyle = '#3d2410'; x.strokeRect(2, 2, 60, 36);
    x.fillStyle = '#ffeb3b';
    x.font = 'bold 20px monospace'; x.textAlign = 'center';
    x.fillText(G.holeIndex + 1, 32, 24);
    x.font = 'bold 9px monospace';
    x.fillText('PAR ' + HOLES[G.holeIndex].par, 32, 35);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    const b = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 0.25), new THREE.MeshLambertMaterial({ map: t }));
    b.position.set(h.tee.y - 13, 1.0, -h.tee.x + 4);
    courseGroup.add(b);
  }

  // flechas slope
  {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 16;
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.font = 'bold 14px monospace';
    x.fillText('>>>', 6, 13);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    const s0 = slopeAt(h.pin.x, h.pin.y);
    const mg = Math.hypot(s0.x, s0.y);
    if (mg > 0.06){
      const an = Math.atan2(s0.y, s0.x);
      for (let k = 0; k < 3; k++){
        const m = new THREE.SpriteMaterial({ map: t, transparent: true, color: mg > 0.6 ? 0xff5252 : 0xffffff });
        const sp = new THREE.Sprite(m);
        sp.scale.set(6, 1.5, 1);
        sp.position.set(h.pin.y - 8 + k * 8, 1.2 + Math.sin(k) * 0.3, -h.pin.x);
        sp.userData.ang = an;
        sp.userData.k = k;
        slopeArrows.push(sp);
        courseGroup.add(sp);
      }
    }
  }
}

export function fairwayCenterAt(wx){
  const h = HOLES[G.holeIndex];
  const t = Math.max(0, Math.min(1, (wx - h.tee.x) / ((h.pin.x - h.tee.x) || 1)));
  return { y: h.tee.y + (h.pin.y - h.tee.y) * t, t };
}

export function slopeAt(x, y){
  if (!onGreen(x, y)) return { x: 0, y: 0 };
  const t = HOLES[G.holeIndex].green.tilt;
  return { x: t.x * 0.9, y: t.y * 0.9 };
}
export function onGreen(x, y){
  const h = HOLES[G.holeIndex];
  return ((x - h.pin.x) / h.green.rx) ** 2 + ((y - h.pin.y) / h.green.ry) ** 2 < 1;
}
export function distToPin(x, y){
  const h = HOLES[G.holeIndex];
  return Math.hypot(x - h.pin.x, y - h.pin.y);
}

// ----- camera -----
const camPos = new THREE.Vector3();
const camTgt = new THREE.Vector3();
let camInit = false;

export function aimDir3(){
  return new THREE.Vector3(Math.sin(G.aim), 0, -Math.cos(G.aim));
}
export function cutCamToBall(){
  const onG = onGreen(G.ball.x, G.ball.y);
  const back = onG ? 10.5 : 17;
  const up   = onG ? 5    : 7.2;
  const d = aimDir3();
  const bp = V3(G.ball.x, G.ball.y, 0);
  camPos.copy(bp).addScaledVector(d, -back);
  camPos.y = up;
  camTgt.copy(bp).addScaledVector(d, 20);
  camTgt.y = 1.2;
  camInit = true;
}
export function freezeCam(){ /* durante el vuelo la cámara se congela — no-op */ }
export function updateCamera(dt){
  if (!camInit) cutCamToBall();
  if (!G.flight){
    const onG = onGreen(G.ball.x, G.ball.y);
    const back = onG ? 10.5 : 17;
    const up   = onG ? 5    : 7.2;
    const d = aimDir3();
    const bp = V3(G.ball.x, G.ball.y, 0);
    const wp = bp.clone().addScaledVector(d, -back);
    wp.y = up;
    const wt = bp.clone().addScaledVector(d, 20);
    wt.y = 1.2;
    camPos.lerp(wp, Math.min(1, dt * 4));
    camTgt.lerp(wt, Math.min(1, dt * 4));
  }
  camera.position.copy(camPos);
  camera.lookAt(camTgt);
}

// ----- sprite del golfista -----
export function drawGolfSprite(){
  const g = GOLFERS[G.gi];
  const sp = SPR[G.gi];
  const PX = 2;
  const gx2 = golferCanvas.getContext('2d');
  gx2.clearRect(0, 0, 72, 72);
  gx2.imageSmoothingEnabled = false;

  const follow = G.swing.stage === 'follow';
  const putt   = onGreen(G.ball.x, G.ball.y) || G.swing.stage === 'pdown';
  const legs   = follow ? sp.legsF : sp.legsA;
  const T      = follow ? sp.up    : sp.bent;
  const fx = 22, fy = 70 - 10 * PX;
  gx2.drawImage(legs, fx, fy, 12 * PX, 10 * PX);
  const tx = fx - 1 * PX, ty = fy - T.height * PX + 2 * PX;
  gx2.drawImage(T, tx, ty, T.width * PX, T.height * PX);
  gx2.drawImage(sp.head, tx + 8 * PX - 5 * PX, ty - 9 * PX + 2 * PX, 10 * PX, 10 * PX);

  const clubA = swingClubA() * Math.PI / 180;
  const shx = tx + 7 * PX, shy = ty + 5 * PX;
  const Lp  = (putt ? 13 : 22) * PX;
  const tipX = shx + Math.sin(clubA) * Lp;
  const tipY = shy + Math.cos(clubA) * Lp;

  gx2.strokeStyle = g.skin;
  gx2.lineWidth = 2.4 * PX; gx2.lineCap = 'round';
  gx2.beginPath();
  gx2.moveTo(shx - 2 * PX, shy);
  gx2.lineTo(shx + Math.sin(clubA) * Lp * 0.55, shy + Math.cos(clubA) * Lp * 0.55);
  gx2.stroke();

  gx2.fillStyle = '#f4f4f4';
  gx2.fillRect(shx + Math.sin(clubA) * Lp * 0.55 - 1.6 * PX, shy + Math.cos(clubA) * Lp * 0.55 - 1.6 * PX, 3.2 * PX, 3.2 * PX);

  gx2.strokeStyle = '#9a8b7a';
  gx2.lineWidth = 1.4 * PX;
  gx2.beginPath();
  gx2.moveTo(shx, shy);
  gx2.lineTo(tipX, tipY);
  gx2.stroke();

  gx2.fillStyle = putt ? '#cfd8dc' : '#5d6b7a';
  gx2.fillRect(tipX - 2 * PX, tipY - 1 * PX, 4 * PX, 2.4 * PX);

  golferTex.needsUpdate = true;
}

export function swingClubA(){
  const s = G.swing;
  if (s.stage === 'back')    return -15 - 165 * (G.meter ? Math.min(1, G.meter.p) : 0);
  if (s.stage === 'top')    return -185 + Math.sin(performance.now() / 90) * 4;
  if (s.stage === 'down')   return -185 + 195 * Math.min(1, s.t / 0.13);
  if (s.stage === 'pdown')  { const k = Math.min(1, s.t / 0.15); return -15 + 30 * k - 50 * Math.max(0, k - 0.5); }
  if (s.stage === 'follow') return 10 + 125 * Math.min(1, s.t / 0.5 * 1.4);
  return -14 + Math.sin(performance.now() / 600) * 1.5;
}

// ----- sync 3D -----
export function syncScene(dt){
  const bp = V3(G.ball.x, G.ball.y, G.ball.h || 0);
  ballMesh.position.copy(bp);
  ballMesh.visible = !G.holed || G.flight || G.roll || G.putt || true;

  const sh = V3(G.ball.x, G.ball.y, 0);
  shadowMesh.position.set(sh.x, 0.03, sh.z);
  const hh = G.ball.h || 0;
  shadowMesh.material.opacity = Math.max(0.08, 0.35 - hh * 0.012);
  const ss = Math.max(0.4, 1 - hh * 0.02);
  shadowMesh.scale.set(ss, ss, 1);

  if (G.flight && G.flight.trail.length > 1){
    const pts = G.flight.trail.filter((_, i) => i % 2 === 0).map(p => V3(p.x, p.y, p.h || 0));
    trailLine.geometry.setFromPoints(pts);
    trailLine.visible = true;
  } else {
    trailLine.visible = false;
  }

  const d = aimDir3();
  golferSprite.position.set(bp.x - d.z * 1.7, 1.7, bp.z + d.x * 1.7);
  golferSprite.visible = !G.flight && !G.holed;

  const k = golfKey();
  if (k !== lastGolfKey || G.swing.stage !== 'idle'){
    drawGolfSprite();
    lastGolfKey = k;
  }

  const showAim = G.screen === 'play' && !G.meter && !G.flight && !G.roll && !G.putt && !G.holed;
  aimLine.visible = aimRing.visible = showAim;
  if (showAim){
    const club = CLUBS[G.clubIndex];
    const maxR = club.max * driveScale();
    const rr = club.id === 'PT' ? Math.min(28, distToPin(G.ball.x, G.ball.y)) : Math.min(maxR, distToPin(G.ball.x, G.ball.y));
    const ex = G.ball.x + Math.cos(G.aim) * rr;
    const ey = G.ball.y + Math.sin(G.aim) * rr;
    const pts = [];
    for (let i = 0; i <= 14; i++){
      const t = i / 14;
      const px = G.ball.x + (ex - G.ball.x) * t;
      const py = G.ball.y + (ey - G.ball.y) * t + G.curve * Math.sin(t * Math.PI) * 14;
      pts.push(V3(px, py, 0.4));
    }
    aimLine.geometry.setFromPoints(pts);
    aimLine.computeLineDistances();
    const ep = V3(ex, ey, 0.15);
    aimRing.position.copy(ep);
    const pu = 1 + Math.sin(performance.now() / 200) * 0.12;
    aimRing.scale.set(pu, pu, pu);
    aimRing.material.color.set(G.curve ? 0x40c4ff : 0xffeb3b);
  }

  for (const w of waterMats) w.map.offset.x += dt * 0.06;
  cloudGroup.children.forEach((c, i) => {
    c.position.x += dt * (1.2 + i * 0.2);
    if (c.position.x > 240) c.position.x = -240;
  });
  if (flagPennant) flagPennant.rotation.y = Math.sin(G.time * 3) * 0.25;

  const s0 = slopeAt(HOLES[G.holeIndex].pin.x, HOLES[G.holeIndex].pin.y);
  const an = Math.atan2(s0.y, s0.x);
  slopeArrows.forEach(sp => {
    sp.visible = onGreen(G.ball.x, G.ball.y);
    sp.position.y = 1.3 + Math.sin(G.time * 3 + sp.userData.k) * 0.25;
    sp.material.rotation = -an;
  });

  updateCamera(dt);
}

export function worldToScreen(v){
  const p = v.clone().project(camera);
  return { x: (p.x * 0.5 + 0.5) * 960, y: (-p.y * 0.5 + 0.5) * 540, behind: p.z > 1 };
}

// ----- overlay 2D -----
function drawOverlay(){
  const ctx = c2d.getContext('2d');
  ctx.clearRect(0, 0, 960, 540);

  if (G.screen === 'select'){ drawSelect(ctx); return; }
  if (G.screen === 'intro'){ drawIntro(ctx); return; }

  drawPinLabel(ctx);
  drawMinimap(ctx);
  drawGauge(ctx);
  drawBanner(ctx);

  if (G.fade > 0){
    ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, G.fade * 1.4) + ')';
    ctx.fillRect(0, 0, 960, 540);
    G.fade -= 0.06;
  }
}

function drawPinLabel(ctx){
  const h = HOLES[G.holeIndex];
  const p = V3(h.pin.x, h.pin.y, 7);
  const s = worldToScreen(p);
  if (s.behind) return;
  const d = distToPin(G.ball.x, G.ball.y);
  const label = 'PIN ' + d.toFixed(0) + 'y';
  ctx.font = '10px "Press Start 2P",monospace';
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = '#000c';
  ctx.fillRect(s.x - tw / 2 - 5, s.y - 20, tw + 10, 20);
  ctx.fillStyle = '#ffeb3b';
  ctx.fillText(label, s.x - tw / 2, s.y - 6);
}

function drawMinimap(){
  const ctx = c2d.getContext('2d');
  const mw = 210, mh = 112, mx = 960 - mw - 12, my = 12;
  const h = HOLES[G.holeIndex];
  ctx.fillStyle = '#000b';
  ctx.fillRect(mx - 5, my - 5, mw + 10, mh + 22);
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 2;
  ctx.strokeRect(mx - 5, my - 5, mw + 10, mh + 22);
  ctx.lineWidth = 1;

  const x0 = h.tee.x - 30, x1 = h.pin.x + 50;
  const X = (wx) => mx + (wx - x0) / (x1 - x0) * mw;

  const ys = [h.tee.y, h.pin.y];
  for (const b of h.bunkers) ys.push(b.y - b.ry, b.y + b.ry);
  for (const w of h.water)   ys.push(w.y - w.ry, w.y + w.ry);
  for (const t of h.trees)  ys.push(t.y);
  const y0 = Math.min.apply(null, ys) - 30;
  const y1 = Math.max.apply(null, ys) + 30;
  const Y = (wy) => my + (1 - (wy - y0) / (y1 - y0)) * mh;

  ctx.strokeStyle = '#5cc46a';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(X(h.tee.x), Y(h.tee.y));
  ctx.lineTo(X(h.pin.x), Y(h.pin.y));
  ctx.stroke();

  ctx.fillStyle = '#cbb26a';
  for (const w of h.water){
    ctx.beginPath();
    ctx.ellipse(X(w.x), Y(w.y), Math.max(2, w.rx * 1.35 / (x1 - x0) * mw), Math.max(1.5, w.ry * 1.35 / (y1 - y0) * mh), 0, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = '#6b5a4a';
  for (const c of (h.cliffs || [])){
    ctx.beginPath();
    ctx.ellipse(X(c.x), Y(c.y), Math.max(2, c.rx / (x1 - x0) * mw), Math.max(1.5, c.ry / (y1 - y0) * mh), 0, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = '#2f9fd8';
  for (const w of h.water){
    ctx.beginPath();
    ctx.ellipse(X(w.x), Y(w.y), Math.max(2, w.rx / (x1 - x0) * mw), Math.max(1.5, w.ry / (y1 - y0) * mh), 0, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = '#8be08b';
  ctx.beginPath();
  ctx.ellipse(X(h.pin.x), Y(h.pin.y), Math.max(4, h.green.rx * 1.34 / (x1 - x0) * mw), Math.max(3, h.green.ry * 1.34 / (y1 - y0) * mh), 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#ecd88f';
  for (const b of h.bunkers){
    ctx.beginPath();
    ctx.ellipse(X(b.x), Y(b.y), Math.max(2, b.rx / (x1 - x0) * mw), Math.max(1.5, b.ry / (y1 - y0) * mh), 0, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = '#75e384';
  ctx.beginPath();
  ctx.ellipse(X(h.pin.x), Y(h.pin.y), Math.max(3, h.green.rx / (x1 - x0) * mw), Math.max(2, h.green.ry / (y1 - y0) * mh), 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(X(h.tee.x) - 2, Y(h.tee.y) - 2, 4, 4);
  ctx.fillStyle = '#f00';
  ctx.beginPath();
  ctx.arc(X(h.pin.x), Y(h.pin.y), 3, 0, 7);
  ctx.fill();

  const rr = CLUBS[G.clubIndex].id === 'PT' ? 28 : Math.min(CLUBS[G.clubIndex].max * driveScale(), distToPin(G.ball.x, G.ball.y));
  ctx.strokeStyle = '#fff';
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(X(G.ball.x), Y(G.ball.y));
  ctx.lineTo(X(G.ball.x + Math.cos(G.aim) * rr), Y(G.ball.y + Math.sin(G.aim) * rr));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(X(G.ball.x), Y(G.ball.y), 3.4, 0, 7);
  ctx.fill();

  ctx.strokeStyle = '#f4f4f4';
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
  for (const s of [-1, 1]){
    ctx.beginPath();
    ctx.moveTo(X(h.tee.x - 10), Y(h.tee.y + s * (h.fairwayW / 2 + 55)));
    ctx.lineTo(X(h.pin.x + 30), Y(h.pin.y + s * (h.fairwayW / 2 + 55)));
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffd23f';
  ctx.font = '8px "Press Start 2P",monospace';
  ctx.fillText('MAP', mx, my + mh + 14);
}

function drawGauge(){
  if (G.screen !== 'play') return;
  const ctx = c2d.getContext('2d');
  const gx = 960 - 64, gw = 34, gy = 150;
  const gh = 540 - 150 - 118;
  const F = '8px "Press Start 2P",monospace';

  ctx.fillStyle = '#000c';
  ctx.fillRect(gx - 34, gy - 44, gw + 42, gh + 96);
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 2;
  ctx.strokeRect(gx - 34, gy - 44, gw + 42, gh + 96);
  ctx.lineWidth = 1;

  ctx.fillStyle = '#ffd23f';
  ctx.font = F;
  ctx.textAlign = 'center';
  ctx.fillText('POWER', gx + gw / 2, gy - 28);
  ctx.fillStyle = '#fff';
  ctx.fillText(CLUBS[G.clubIndex].id, gx + gw / 2, gy - 14);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(gx, gy, gw, gh);

  const cap = powerCap();
  const segs = 30;
  for (let i = 0; i < segs; i++){
    const fm = (i + 0.5) / segs;
    ctx.fillStyle = fm > 1 ? '#b388ff' : fm > 0.85 ? '#ff5252' : fm > 0.6 ? '#ffb300' : '#00e676';
    const y1 = gy + gh - ((i + 1) / segs / cap) * gh;
    const y0 = gy + gh - (i / segs / cap) * gh;
    const on = G.meter && G.meter.phase === 'power' ? fm <= G.meter.p : (G.meter ? fm <= G.meter.power : false);
    if (on) ctx.fillRect(gx + 3, y1 + 1, gw - 6, Math.max(1, y0 - y1 - 1));
  }

  ctx.strokeStyle = '#000';
  for (let i = 0; i <= segs; i++){
    const y = gy + gh - (i / segs / cap) * gh;
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx + gw, y);
    ctx.stroke();
  }
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(gx, gy, gw, gh);

  const y100 = gy + gh - (1 / cap) * gh;
  ctx.fillStyle = '#fff';
  ctx.fillRect(gx - 5, y100 - 1, gw + 10, 2);

  if (onGreen(G.ball.x, G.ball.y)){
    const gyp = gy + gh - (puttNeed() / cap) * gh;
    ctx.fillStyle = '#40c4ff';
    ctx.fillRect(gx - 7, gyp - 2, gw + 14, 4);
  }

  if (G.meter && G.meter.phase === 'height'){
    const lie = G.meter.lie;
    const rz = redZone(lie);
    const sw = heightSweet();
    ctx.fillStyle = '#c62828';
    ctx.fillRect(gx, gy, gw, rz * gh);
    ctx.fillRect(gx, gy + gh * (1 - rz), gw, rz * gh);
    ctx.fillStyle = '#fff';
    ctx.fillRect(gx, gy + gh / 2 - sw * gh, gw, sw * gh * 2);
    const yp = gy + gh - G.meter.p * gh;
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(gx - 6, yp - 2, gw + 12, 5);
    ctx.fillStyle = '#fff';
    ctx.font = '7px "Press Start 2P",monospace';
    ctx.fillText(lie.toUpperCase(), gx - 28, gy + gh + 14);
  }

  if (G.meter && G.meter.phase === 'power'){
    ctx.fillStyle = '#fff';
    ctx.font = F;
    ctx.fillText((G.meter.p * 100).toFixed(0) + '%', gx - 12, gy + gh + 16);
  }

  ctx.font = '8px "Press Start 2P",monospace';
  let hint = '';
  if (G.holed) hint = 'ESPACIO: SIGUIENTE';
  else if (G.flight) hint = '...';
  else if (!G.meter) hint = 'ESPACIO: SWING · Z:X HOOK · C:RECTO';
  else if (G.meter.phase === 'power') hint = 'FIJA POTENCIA!';
  else hint = 'CLAVA EL BLANCO!';

  ctx.fillStyle = '#000a';
  ctx.fillRect(10, 540 - 28, ctx.measureText(hint).width + 14, 20);
  ctx.fillStyle = '#ffeb3b';
  ctx.fillText(hint, 17, 540 - 14);
}

function drawBanner(){
  if (!G.banner) return;
  const ctx = c2d.getContext('2d');
  ctx.globalAlpha = Math.min(1, G.banner.t * 2);
  ctx.fillStyle = '#000d';
  ctx.fillRect(0, 540 / 2 - 46, 960, 76);
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 540 / 2 - 46, 960 - 20, 76);
  ctx.lineWidth = 1;
  ctx.fillStyle = '#ffd23f';
  ctx.font = '28px "Press Start 2P",monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 5;
  ctx.strokeText(G.banner.txt, 960 / 2, 540 / 2 + 8);
  ctx.fillText(G.banner.txt, 960 / 2, 540 / 2 + 8);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}

function drawSelect(ctx){
  const g = ctx.createLinearGradient(0, 0, 0, 540);
  g.addColorStop(0, '#5a5a1e');
  g.addColorStop(1, '#2d2d10');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 960, 540);
  ctx.fillStyle = '#f4f4f4';
  ctx.font = 'italic bold 24px "Brush Script MT","Segoe Script",cursive';
  ctx.textAlign = 'center';
  ctx.fillText('Golfer Selection', 960 / 2, 34);
  ctx.textAlign = 'left';

  GOLFERS.forEach((gf, i) => {
    const y = 112 + i * 62;
    const sel = i === G.gi;
    if (sel){ ctx.fillStyle = '#ffd23f22'; ctx.fillRect(40, y - 46, 960 - 80, 62); }
    ctx.strokeStyle = sel ? '#ffd23f' : '#888';
    ctx.lineWidth = sel ? 3 : 1;
    ctx.strokeRect(40, y - 46, 960 - 80, 62);
    ctx.lineWidth = 1;

    const sp = SPR[i], PS = 4;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1d3b22';
    ctx.fillRect(52, y - 40, 10 * PS, 10 * PS);
    ctx.drawImage(sp.head, 52, y - 40, 10 * PS, 10 * PS);
    ctx.fillStyle = gf.shirt;
    ctx.fillRect(52, y - 40 + 10 * PS, 10 * PS, 3 * PS);

    const fl = FLAGS[gf.ctry];
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 12; c++){
        ctx.fillStyle = FCOL[fl[r][c]];
        ctx.fillRect(52 + 10 * PS + 8 + c * 2, y - 40 + r * 2, 2, 2);
      }

    ctx.fillStyle = sel ? '#ffd23f' : '#fff';
    ctx.font = '9px "Press Start 2P",monospace';
    ctx.fillText((i + 1) + '. ' + gf.name, 150, y - 24);
    ctx.fillStyle = '#ffd23f';
    ctx.font = '7px "Press Start 2P",monospace';
    ctx.fillText(gf.nick, 150, y - 10);

    const stats = [['DRV', gf.drv, '#ff5252'], ['ACC', gf.acc, '#ffb300'], ['SKL', gf.skl, '#ffeb3b'], ['REC', gf.rec, '#00e676'], ['PUT', gf.put, '#40c4ff']];
    stats.forEach((st, k) => {
      const bx = 420 + k * 100;
      ctx.fillStyle = '#888';
      ctx.fillText(st[0], bx, y - 24);
      for (let sgm = 0; sgm < 5; sgm++){
        ctx.fillStyle = sgm < st[1] ? st[2] : '#333';
        ctx.fillRect(bx + sgm * 11, y - 18, 9, 8);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(bx + sgm * 11, y - 18, 9, 8);
      }
    });
  });

  ctx.fillStyle = '#fff';
  ctx.font = '9px "Press Start 2P",monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PULSA ESPACIO O CLICK PARA SALIR · 2.5D WEB', 960 / 2, 540 - 18);
  ctx.textAlign = 'left';
}

function drawIntro(ctx){
  const h = HOLES[G.holeIndex];
  ctx.fillStyle = '#0d2b16';
  ctx.fillRect(0, 0, 960, 540);

  const names = ['1st', '2nd', '3rd'];
  ctx.fillStyle = '#ffd23f';
  ctx.font = '24px "Press Start 2P",monospace';
  ctx.textAlign = 'center';
  ctx.fillText((names[G.holeIndex] || (G.holeIndex + 1) + 'th') + ' HOLE  PAR ' + h.par, 960 / 2, 56);

  ctx.fillStyle = '#fff';
  ctx.font = '10px "Press Start 2P",monospace';
  ctx.fillText(holeLen().toFixed(0) + ' YARDS · WIND ' + G.wind.mph.toFixed(0) + ' MPH · ' + GOLFERS[G.gi].name, 960 / 2, 84);

  const mx = 130, my = 116, mw = 960 - 260, mh = 540 - 240;
  ctx.fillStyle = '#1d6b2a';
  ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 2;
  ctx.strokeRect(mx, my, mw, mh);
  ctx.lineWidth = 1;

  const x0 = h.tee.x - 30, x1 = h.pin.x + 50;
  const X = (wx) => mx + (wx - x0) / (x1 - x0) * mw;
  const ys = [h.tee.y, h.pin.y];
  for (const b of h.bunkers) ys.push(b.y - b.ry, b.y + b.ry);
  for (const w of h.water)   ys.push(w.y - w.ry, w.y + w.ry);
  for (const t of h.trees)  ys.push(t.y);
  const y0 = Math.min.apply(null, ys) - 30;
  const y1 = Math.max.apply(null, ys) + 30;
  const Y = (wy) => my + (1 - (wy - y0) / (y1 - y0)) * mh;

  ctx.strokeStyle = '#5cc46a';
  ctx.lineWidth = 24;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(X(h.tee.x), Y(h.tee.y));
  ctx.lineTo(X(h.pin.x), Y(h.pin.y));
  ctx.stroke();

  ctx.fillStyle = '#cbb26a';
  for (const w of h.water){
    ctx.beginPath();
    ctx.ellipse(X(w.x), Y(w.y), w.rx * 1.35 / (x1 - x0) * mw, w.ry * 1.35 / (y1 - y0) * mh, 0, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = '#6b5a4a';
  for (const c of (h.cliffs || [])){
    ctx.beginPath();
    ctx.ellipse(X(c.x), Y(c.y), c.rx / (x1 - x0) * mw, c.ry / (y1 - y0) * mh, 0, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = '#2f9fd8';
  for (const w of h.water){
    ctx.beginPath();
    ctx.ellipse(X(w.x), Y(w.y), w.rx / (x1 - x0) * mw, w.ry / (y1 - y0) * mh, 0, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = '#ecd88f';
  for (const b of h.bunkers){
    ctx.beginPath();
    ctx.ellipse(X(b.x), Y(b.y), b.rx / (x1 - x0) * mw, b.ry / (y1 - y0) * mh, 0, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = '#14521f';
  for (const t of h.trees){
    ctx.beginPath();
    ctx.arc(X(t.x), Y(t.y), 5, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = '#8be08b';
  ctx.beginPath();
  ctx.ellipse(X(h.pin.x), Y(h.pin.y), (h.green.rx * 1.25) / (x1 - x0) * mw, (h.green.ry * 1.3) / (y1 - y0) * mh, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#5fd46e';
  ctx.beginPath();
  ctx.ellipse(X(h.pin.x), Y(h.pin.y), h.green.rx / (x1 - x0) * mw, h.green.ry / (y1 - y0) * mh, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(X(h.tee.x) - 3, Y(h.tee.y) - 3, 6, 6);
  ctx.fillStyle = '#f00';
  ctx.beginPath();
  ctx.arc(X(h.pin.x), Y(h.pin.y), 5, 0, 7);
  ctx.fill();

  ctx.strokeStyle = '#f4f4f4';
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1;
  for (const s of [-1, 1]){
    ctx.beginPath();
    ctx.moveTo(X(h.tee.x - 10), Y(h.tee.y + s * (h.fairwayW / 2 + 55)));
    ctx.lineTo(X(h.pin.x + 30), Y(h.pin.y + s * (h.fairwayW / 2 + 55)));
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.fillStyle = '#fff';
  ctx.font = '10px "Press Start 2P",monospace';
  ctx.fillText('ESPACIO: TEE OFF', 960 / 2, 540 - 40);
  ctx.textAlign = 'left';
}

// ----- helpers exportados -----
export function meterSpeed(lie){
  const g = GOLFERS[G.gi];
  return (1.55 - g.acc * 0.17) * (lie === 'fairway' || lie === 'tee' ? 1
    : lie === 'green' ? 0.85
    : lie === 'fringe' ? 1.2
    : lie === 'rough' ? 1.45
    : lie === 'shore' ? 2.2 : 1.8);
}
export function powerCap(){
  const g = GOLFERS[G.gi];
  return g.drv >= 5 ? 1.14 : g.drv >= 4 ? 1.06 : 1.0;
}
export function heightSweet(){
  return 0.09 + GOLFERS[G.gi].skl * 0.028;
}
export function redZone(lie){
  const g = GOLFERS[G.gi];
  return Math.max(0.01,
    (lie === 'shore' ? 0.42
    : lie === 'sand' ? 0.30
    : lie === 'rough' ? 0.17
    : lie === 'fringe' ? 0.08
    : 0.055) - g.rec * 0.028);
}
export function driveScale(){
  return 0.86 + GOLFERS[G.gi].drv * 0.04;
}
export function holeLen(){
  const h = HOLES[G.holeIndex];
  return Math.hypot(h.tee.x - h.pin.x, h.tee.y - h.pin.y);
}
export function puttNeed(){
  const d = distToPin(G.ball.x, G.ball.y);
  const s = slopeAt(G.ball.x, G.ball.y);
  const along = Math.cos(G.aim) * s.x + Math.sin(G.aim) * s.y;
  const vNeed = Math.sqrt(Math.max(4, 2 * 12 * d * 1.12));
  return Math.max(0.05, Math.min(1, ((vNeed - 4) / 20) - along * 0.10));
}
export function autoClub(){
  const d = distToPin(G.ball.x, G.ball.y);
  if (onGreen(G.ball.x, G.ball.y)) return 7;
  for (const i of [0, 1, 2, 3, 4, 5, 6])
    if (d <= CLUBS[i].max * driveScale() * 1.02) return i;
  return 0;
}
export function golfKey(){
  return G.gi + '|' + G.swing.stage + '|' + (G.meter ? G.meter.p.toFixed(2) : '') + '|' + Math.round(performance.now() / 120);
}

// ----- loop accesible desde main -----
export function gameLoop(now){
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  G.time += dt;

  if (G.banner){ G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }

  if (G.screen === 'play'){
    const sw = G.swing;
    if (sw.stage === 'back' && !G.meter) sw.stage = 'idle';
    if (sw.stage === 'top' && (!G.meter || G.meter.phase !== 'height')) sw.stage = 'idle';
    if (sw.stage === 'down' || sw.stage === 'pdown'){
      sw.t += dt;
      if (sw.t >= 0.15) onImpact();
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

  syncScene(dt);
  renderer.render(scene, camera);
  drawOverlay();
  requestAnimationFrame(gameLoop);
}

let lastTime = performance.now();

// ----- vida del módulo -----
export { drawOverlay, gameLoop };
