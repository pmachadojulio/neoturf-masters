/* ============================================================
   NEO TURF MASTERS — hoyos (yardas, geometría)
   ============================================================ */
/** Cada hoyo se describe en el plano del juego: x = distancia desde el tee (adelante),
 *  y = desviación lateral. Los colores de playability se calculan desde acá. */
export const HOLES = [
  { // 1 — Par 4 con bunkers laterales, agua central, árboles, cliff al fondo
    par:4, tee:{x:0,y:0}, pin:{x:390,y:30}, fairwayW:46,
    green:{ rx:20, ry:15, tilt:{x:0.55,y:-0.35} },
    bunkers:[{x:300,y:-18,rx:16,ry:9},{x:352,y:52,rx:14,ry:8}],
    water:[{x:200,y:70,rx:70,ry:26}],
    cliffs:[{x:250,y:-80,rx:95,ry:24}],
    trees:[{x:150,y:-55,t:'pine'},{x:250,y:60,t:'oak'},{x:330,y:-45,t:'pine'},{x:120,y:50,t:'palm'}],
  },
  { // 2 — Par 3 corto con green en diagonal, cliff al fondo
    par:3, tee:{x:0,y:0}, pin:{x:175,y:-20}, fairwayW:40,
    green:{ rx:16, ry:13, tilt:{x:-0.5,y:0.45} },
    bunkers:[{x:150,y:2,rx:18,ry:10},{x:190,y:-42,rx:12,ry:7}],
    water:[], trees:[{x:90,y:45,t:'oak'},{x:210,y:35,t:'pine'}],
    cliffs:[{x:120,y:-72,rx:85,ry:20}],
  },
  { // 3 — Par 5 largo con agua y múltiples bunkers, cliffs laterales
    par:5, tee:{x:0,y:0}, pin:{x:520,y:-40}, fairwayW:50,
    green:{ rx:21, ry:15, tilt:{x:0.3,y:0.6} },
    bunkers:[{x:400,y:-70,rx:16,ry:9},{x:480,y:-8,rx:15,ry:8},{x:540,y:-60,rx:13,ry:7}],
    water:[{x:320,y:40,rx:60,ry:24}],
    cliffs:[{x:360,y:70,rx:80,ry:22},{x:560,y:-90,rx:60,ry:18}],
    trees:[{x:180,y:-60,t:'palm'},{x:300,y:-55,t:'pine'},{x:450,y:45,t:'oak'},{x:560,y:10,t:'pine'}],
  },
];

/** Factor de escala visual de altura (3D: 1 unidad de juego = HS metros en altura) */
export const HS = 0.35;

/** Convierte (x, y, h) del mundo de juego a THREE.Vector3.
 *  Eje Z = -x (por eso el tee queda adelante del view). */
export const V3 = (x, y, h) => new THREE.Vector3(y, (h || 0) * HS, -x);
