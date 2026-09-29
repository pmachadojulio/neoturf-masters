/* ============================================================
   NEO TURF MASTERS — datos
   ============================================================ */

/** Golfistas con stats de arcade (DRV=drive, ACC=precisión, SKL=habilidad general,
 *  REC=control de red zone, PUT=putt). Cuanto mayor, mejor. 1..5. */
export const GOLFERS = [
  { name:'GEORGE SPINNER', nick:'YOUNG HERO', ctry:'USA', drv:3, acc:3, skl:3, rec:3, put:3,
    shirt:'#7a8b3d', dark:'#5a6b2d', pants:'#3d3d3d', skin:'#f0c090', hair:'#5a3a1a', feat:'sidepart' },
  { name:'THOMAS STEWART', nick:'TECHNICIAN', ctry:'UK',  drv:2, acc:4, skl:5, rec:4, put:3,
    shirt:'#3d6b8b', dark:'#2d4b63', pants:'#222',    skin:'#f0c8a0', hair:'#d8b83d', feat:'glasses' },
  { name:'FRANK ADAMS',    nick:'VETERAN',    ctry:'AUS', drv:1, acc:2, skl:4, rec:5, put:2,
    shirt:'#6b5a3d', dark:'#4a3d2d', pants:'#2d2d2d', skin:'#d8a070', hair:'#4a2d1a', feat:'cap_stache' },
  { name:'ROBERT LANDORT', nick:'SHOT MAKER', ctry:'GER', drv:4, acc:5, skl:2, rec:2, put:4,
    shirt:'#c8b83d', dark:'#8b7d2d', pants:'#1a1a1a', skin:'#f0c090', hair:'#b8b8b8', feat:'stern' },
  { name:'FERNANDO ALMEIDA',nick:'POWER GOLFER',ctry:'BRA',drv:5, acc:1, skl:1, rec:1, put:1,
    shirt:'#2d9b4d', dark:'#1d6b32', pants:'#1d4b22', skin:'#8b5a32', hair:'#1a1a1a', feat:'band' },
  { name:'TOYOSHIGE TAKENO',nick:'PUTT MASTER', ctry:'JPN',drv:3, acc:2, skl:4, rec:2, put:5,
    shirt:'#8b3d9b', dark:'#5d2d6b', pants:'#2d1d4b', skin:'#f0c090', hair:'#111',    feat:'visor' },
];

/** Palos: distancia máxima en yardas (a pleno + condiciones perfectas) y loft en grados */
export const CLUBS = [
  { id:'1W', name:'1 WOOD',     max:270, loft:12 },
  { id:'3W', name:'3 WOOD',     max:240, loft:16 },
  { id:'5I', name:'5 IRON',     max:200, loft:24 },
  { id:'7I', name:'7 IRON',     max:165, loft:32 },
  { id:'9I', name:'9 IRON',     max:135, loft:40 },
  { id:'PW', name:'WEDGE',      max:100, loft:52 },
  { id:'SW', name:'SAND WEDGE', max:75,  loft:56 },
  { id:'PT', name:'PUTTER',     max:30,  loft:4 },
];

/** Colores de bandera por país */
export const FLAGS = {
  USA: ['RRRRRWWWWWWR','RRRRRWWWWWWR','BBBBBWWWWWWR','BBBBBRRRRRRR','BBBBBWWWWWWR','RRRRRRRRRRRR','WWWWWWWWWWWW','RRRRRRRRRRRR','WWWWWWWWWWWW'],
  UK:  ['BBBBWWBBBBB','BBBWRRWBBBB','BBWRRRRWBBB','WWRRRRRRRWW','BBWRRRRWBBB','BBBWRRWBBBB','BBBBWWBBBBB','BBBBWWBBBBB','BBBBWWBBBBB'],
  AUS: ['BBBKBBBBBBB','BBBBBKBBBBB','BBWBBBBBWBB','BBBBBBBBBBB','BBWBBBBBWBB','BBBBBKBBBBB','BBBKBBBBBBB','BBBBBBBBBBB','BBBBBBBBBBB'],
  GER: ['KKKKKKKKKKKK','KKKKKKKKKKKK','KKKKKKKKKKKK','RRRRRRRRRRRR','RRRRRRRRRRRR','RRRRRRRRRRRR','YYYYYYYYYYYY','YYYYYYYYYYYY','YYYYYYYYYYYY'],
  BRA: ['GGGGGGGGGGGG','GGGGGGYYGGGG','GGGGYYYYYYGG','GGGYYBBYYGGG','GGGGYYYYYYGG','GGGGGGYYGGGG','GGGGGGGGGGGG','GGGGGGGGGGGG','GGGGGGGGGGGG'],
  JPN: ['WWWWWWWWWWWW','WWWWWWWWWWWW','WWWRRRRRWWW','WWRRRRRRRWW','WWRRRRRRRWW','WWRRRRRRRWW','WWWRRRRRWWW','WWWWWWWWWWWW','WWWWWWWWWWWW'],
};
export const FCOL = { R:'#d83a3a', W:'#f4f4f4', B:'#2a4ad8', K:'#111', Y:'#ffd23f', G:'#2d9b4d' };

/** Palette por golfista para pixel-art */
export function palFor(g){
  return {
    K:'#101010', T:g.shirt, t:g.dark, P:g.pants, p:'rgba(0,0,0,0.35)',
    S:g.skin, s:'#c89868', H:g.hair, C:g.hair, E:'#101010', G:'#222', M:'#2d1a0d',
    V:'#f4f4f4', Y:'#ffd23f', W:'#f4f4f4',
  };
}
