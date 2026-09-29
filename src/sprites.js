/* ============================================================
   NEO TURF MASTERS — sprites de pixel art para golfistas
   ============================================================ */
import { GOLFERS, FLAGS, FCOL, palFor } from './golfers.js';

/** Planar de cabeza: filas de caracteres que representan píxeles.
 *  K=negro(contorno), H= Cabello, S=piel, E=ojos, s=piel oscura, C=cabello claro,
 *  G=gafas, M=bigote/gorra, V=visor, Y=dorado. */
function headMap(g){
  const rows = [
    '...KKKK...',
    '..KHHHHK..',
    '.KHHHHHHK.',
    '.KHSSSSHK.',
    '.KHSESEHK.',
    '.KHSSSSHK.',
    '..KSSSSK..',
    '..KSssSK..',
    '...KSSK...',
    '....KK....',
  ];
  const f = g.feat;
  if (f === 'glasses'){
    rows[4] = '.KGEEEEGK.';
  }
  if (f === 'cap_stache'){
    rows[1] = '..KCCCCK..';
    rows[2] = '.KCCCCCCK.';
    rows[3] = '.KCCCCCKKK';
    rows[6] = '..KMMMMK..';
  }
  if (f === 'band'){
    rows[0] = '..KKKKKK..';
    rows[1] = '.KHHHHHHK.';
    rows[2] = '.KYYYYYYK.';
  }
  if (f === 'visor'){
    rows[2] = '.KVVVVVKKK';
  }
  return rows;
}

/** Planos de torso */
const TORSO_BENT = [
  '.....KKKKK..',
  '....KTTTTTK.',
  '...KTTtTTTK.',
  '...KTTtTTTK.',
  '..KTTTTTtTK.',
  '..KTtTTTtTK.',
  '...KTTtTTK..',
  '....KTTTK...',
  '.....KTK....',
  '......K.....',
];
const TORSO_UP = [
  '...KKKKK...',
  '..KTTTTTK..',
  '..KTTtTTK..',
  '..KTTtTTK..',
  '.KTTTtTTTK.',
  '.KTtTTtTTK.',
  '..KTTtTTK..',
  '..KTTtTTK..',
  '...KTTTK...',
  '....KKK....',
];

/** Patas — dirección (address) vs follow-through */
const LEGS_ADDR = [
  '..KK....KK..',
  '..KPK...KPK.',
  '..KPK...KPK.',
  '..KPpK..KPK.',
  '..KPpK..KPK.',
  '..KPK...KPK.',
  '..KPK...KPK.',
  '.KPPK...KPPK',
  '.KKKK...KKKK',
  '.............',
];
const LEGS_FOLLOW = [
  '...KK...KK..',
  '...KPK..KPK.',
  '...KPK..KPK.',
  '...KPpK.KPK.',
  '...KPpKKPK..',
  '...KPK.KPK..',
  '...KPK.KPK..',
  '..KPPK..KPPK',
  '..KKKK...KKK',
  '.............',
];

/** Mapa de colores por país (usado en selección de golfer) */
const FLAGS = {
  USA: ['RRRRRWWWWWWR','RRRRRWWWWWWR','BBBBBWWWWWWR','BBBBBRRRRRRR','BBBBBWWWWWWR','RRRRRRRRRRRR','WWWWWWWWWWWW','RRRRRRRRRRRR','WWWWWWWWWWWW'],
  UK:  ['BBBBWWBBBBB','BBBWRRWBBBB','BBWRRRRWBBB','WWRRRRRRRWW','BBWRRRRWBBB','BBBWRRWBBBB','BBBBWWBBBBB','BBBBWWBBBBB','BBBBWWBBBBB'],
  AUS: ['BBBKBBBBBBB','BBBBBKBBBBB','BBWBBBBBWBB','BBBBBBBBBBB','BBWBBBBBWBB','BBBBBKBBBBB','BBBKBBBBBBB','BBBBBBBBBBB','BBBBBBBBBBB'],
  GER: ['KKKKKKKKKKKK','KKKKKKKKKKKK','KKKKKKKKKKKK','RRRRRRRRRRRR','RRRRRRRRRRRR','RRRRRRRRRRRR','YYYYYYYYYYYY','YYYYYYYYYYYY','YYYYYYYYYYYY'],
  BRA: ['GGGGGGGGGGGG','GGGGGGYYGGGG','GGGGYYYYYYGG','GGGYYBBYYGGG','GGGGYYYYYYGG','GGGGGGYYGGGG','GGGGGGGGGGGG','GGGGGGGGGGGG','GGGGGGGGGGGG'],
  JPN: ['WWWWWWWWWWWW','WWWWWWWWWWWW','WWWRRRRRWWW','WWRRRRRRRWW','WWRRRRRRRWW','WWRRRRRRRWW','WWWRRRRRWWW','WWWWWWWWWWWW','WWWWWWWWWWWW'],
};
const FCOL = { R:'#d83a3a', W:'#f4f4f4', B:'#2a4ad8', K:'#111', Y:'#ffd23f', G:'#2d9b4d' };

/** Construye un canvas a partir de filas de caracteres y paleta */
function mkCanvas(rows, pal){
  const c = document.createElement('canvas');
  let w = 0;
  rows.forEach(r => { w = Math.max(w, r.length); });
  c.width = w;
  c.height = rows.length;
  const x = c.getContext('2d');
  rows.forEach((row, r) => {
    for (let col = 0; col < row.length; col++){
      const ch = row[col];
      if (ch === '.' || ch === ' ') continue;
      x.fillStyle = pal[ch] || '#f0f';
      x.fillRect(col, r, 1, 1);
    }
  });
  return c;
}

/** Genera y cachea todos los sprites para cada golfista */
export const SPR = {};

export function buildSprites(){
  for (let i = 0; i < GOLFERS.length; i++){
    const g = GOLFERS[i];
    const pal = palFor(g);
    SPR[i] = {
      head:  mkCanvas(headMap(g), pal),
      bent:  mkCanvas(TORSO_BENT, pal),
      up:    mkCanvas(TORSO_UP, pal),
      legsA: mkCanvas(LEGS_ADDR, pal),
      legsF: mkCanvas(LEGS_FOLLOW, pal),
    };
  }
}
