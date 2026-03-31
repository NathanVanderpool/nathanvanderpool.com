// ── CHORD-UTILS.JS ────────────────────────────────────────────────────────────
// Shared chord diagram renderer for all Agapic Chants pages.
// Include this file before any page script that calls chordSVG() or pianoSVG().
//
// LAYOUT NOTES (do not change without updating all constants together):
//   padT = 30   — vertical space above the fret grid for chord name + open/muted markers
//   H    = 100  — total SVG height (padT + gridH:60 + bottomPad:10)
//   Chord name text sits at y=12 (baseline). Open-string circles sit at cy=padT-7=23.
//   This gives ~11px of clearance. Do not reduce padT below 26 or the name
//   will collide with the open-string circles.
// ─────────────────────────────────────────────────────────────────────────────

const CHORD_DB = {
  'E':{base:1,strings:[0,2,2,1,0,0]},'A':{base:1,strings:[-1,0,2,2,2,0]},
  'D':{base:1,strings:[-1,-1,0,2,3,2]},'G':{base:1,strings:[3,2,0,0,0,3]},
  'C':{base:1,strings:[-1,3,2,0,1,0]},'F':{base:1,strings:[1,3,3,2,1,1]},
  'B':{base:2,strings:[-1,2,4,4,4,2]},'Bb':{base:1,strings:[-1,1,3,3,3,1]},
  'Eb':{base:6,strings:[-1,6,8,8,8,6]},'Ab':{base:4,strings:[4,6,6,5,4,4]},
  'Db':{base:4,strings:[-1,4,6,6,6,4]},'Gb':{base:2,strings:[2,4,4,3,2,2]},
  'Emaj7':{base:1,strings:[0,2,1,1,0,0]},'Amaj7':{base:1,strings:[-1,0,2,1,2,0]},
  'Dmaj7':{base:1,strings:[-1,-1,0,2,2,2]},'Gmaj7':{base:1,strings:[3,2,0,0,0,2]},
  'Cmaj7':{base:1,strings:[-1,3,2,0,0,0]},'Fmaj7':{base:1,strings:[-1,-1,3,2,1,0]},
  'Bbmaj7':{base:1,strings:[-1,1,3,2,3,1]},'Ebmaj7':{base:6,strings:[-1,6,8,7,8,6]},
  'Abmaj7':{base:3,strings:[-1,-1,6,5,4,3]},'Dbmaj7':{base:4,strings:[-1,4,6,5,6,4]},
  'Gbmaj7':{base:1,strings:[-1,-1,4,3,2,1]},'Bmaj7':{base:2,strings:[-1,2,4,3,4,2]},
};

// UKE_DB: standard GCEA tuning, strings listed [G, C, E, A]
const UKE_DB = {
  'C':{base:1,strings:[0,0,0,3]},'Db':{base:1,strings:[1,1,1,4]},
  'D':{base:1,strings:[2,2,2,0]},'Eb':{base:1,strings:[3,3,3,1]},
  'E':{base:1,strings:[4,4,4,2]},'F':{base:1,strings:[2,0,1,0]},
  'Gb':{base:1,strings:[3,1,2,1]},'G':{base:1,strings:[0,2,3,2]},
  'Ab':{base:1,strings:[5,3,4,3]},'A':{base:1,strings:[2,1,0,0]},
  'Bb':{base:1,strings:[3,2,1,1]},'B':{base:1,strings:[4,3,2,2]},
  // maj7 voicings — all verified against standard GCEA tuning
  'Cmaj7':{base:1,strings:[0,0,0,2]},   // G C E B
  'Dbmaj7':{base:1,strings:[1,1,1,3]},  // Ab Db F C
  'Dmaj7':{base:1,strings:[2,2,2,4]},   // A D F# C#
  'Ebmaj7':{base:3,strings:[3,3,3,5]},  // Bb Eb G D
  'Emaj7':{base:1,strings:[1,3,0,2]},   // G# D# E B
  'Fmaj7':{base:1,strings:[2,4,1,3]},   // A E F C
  'Gbmaj7':{base:1,strings:[3,1,1,1]},  // Bb Db F Bb
  'Gmaj7':{base:1,strings:[0,2,2,2]},   // G D F# B
  'Abmaj7':{base:1,strings:[0,3,4,3]},  // G Eb Ab C
  'Amaj7':{base:1,strings:[1,1,0,0]},   // G# C# E A
  'Bbmaj7':{base:1,strings:[3,2,1,0]},  // Bb D F A
  'Bmaj7':{base:1,strings:[4,3,2,1]},   // B D# F# A#
};

// Shared constants for pianoSVG
const WHITE_KEYS = [0,2,4,5,7,9,11];
const CHORD_INTERVALS = {'':[ 0,4,7],'maj7':[0,4,7,11],'m':[0,3,7],'7':[0,4,7,10]};

// chordSVG — renders a guitar or ukulele chord box as an SVG string.
// Returns null if the chord is not in the database (caller shows fallback text).
//
// Layout: padT=30 keeps the chord name (y=12) well clear of open-string circles
// (cy=23) and muted-string × markers (y=24). Do not reduce padT below 26.
function chordSVG(name, instrument) {
  const isUke = instrument === 'ukulele';
  const data = isUke ? UKE_DB[name] : CHORD_DB[name];
  if (!data) return null;
  const numStrings = isUke ? 4 : 6;
  const W = isUke ? 54 : 72, H = 100, padL = isUke ? 10 : 14, padT = 30, padR = 8;
  const gridW = W - padL - padR, gridH = H - padT - 10, numFrets = 4;
  const sx = gridW / (numStrings - 1), fy = gridH / numFrets, nutH = 3;
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">`;
  s += `<text x="${W/2}" y="12" text-anchor="middle" font-family="Jost,sans-serif" font-size="10" font-weight="600" fill="#d2684f" letter-spacing="0.04em">${name}</text>`;
  if (data.base === 1) {
    s += `<rect x="${padL}" y="${padT}" width="${gridW}" height="${nutH}" fill="#2a1f14" rx="1"/>`;
  } else {
    s += `<text x="${padL-8}" y="${padT + fy*0.6}" text-anchor="end" font-family="Jost,sans-serif" font-size="7.5" fill="#6b5744">${data.base}</text>`;
  }
  const gt = data.base === 1 ? padT + nutH : padT;
  for (let f = 0; f <= numFrets; f++) {
    const y = gt + f * fy;
    s += `<line x1="${padL}" y1="${y}" x2="${padL+gridW}" y2="${y}" stroke="#c8b8a8" stroke-width="${f===0&&data.base!==1?'1':'0.75'}"/>`;
  }
  for (let i = 0; i < numStrings; i++) {
    const x = padL + i * sx;
    s += `<line x1="${x}" y1="${gt}" x2="${x}" y2="${gt+gridH}" stroke="#c8b8a8" stroke-width="0.75"/>`;
  }
  for (let i = 0; i < numStrings; i++) {
    const x = padL + i * sx, fret = data.strings[i];
    if (fret === -1) {
      s += `<text x="${x}" y="${padT-6}" text-anchor="middle" font-family="Jost,sans-serif" font-size="9" fill="#6b5744">×</text>`;
    } else if (fret === 0) {
      s += `<circle cx="${x}" cy="${padT-7}" r="3.5" fill="none" stroke="#6b5744" stroke-width="1"/>`;
    } else {
      const slot = fret - data.base + 1, cy = gt + (slot - 0.5) * fy;
      s += `<circle cx="${x}" cy="${cy}" r="${sx*0.37}" fill="#d2684f"/>`;
    }
  }
  return s + '</svg>';
}

// pianoSVG — renders a two-octave piano keyboard with chord tones highlighted.
function pianoSVG(name) {
  const NOTES = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  let root = -1, suffix = '', bestLen = 0;
  for (let i = 0; i < NOTES.length; i++) {
    if (name.startsWith(NOTES[i]) && NOTES[i].length > bestLen) {
      bestLen = NOTES[i].length; root = i; suffix = name.slice(NOTES[i].length);
    }
  }
  if (root === -1) return null;
  const intervals = CHORD_INTERVALS[suffix] || CHORD_INTERVALS[''];
  const tones = new Set(intervals.map(i => (root + i) % 12));
  const WW=13, WH=48, BW=8, BH=30, padT=18, W=WW*14+2, H=WH+padT+4;
  const BLACK_SEMIS_C = [1,3,6,8,10];
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">`;
  s += `<text x="${W/2}" y="12" text-anchor="middle" font-family="Jost,sans-serif" font-size="10" font-weight="600" fill="#d2684f" letter-spacing="0.04em">${name}</text>`;
  let wi = 0;
  for (let oct = 0; oct < 2; oct++) {
    for (const k of WHITE_KEYS) {
      const x = wi * WW;
      s += `<rect x="${x+0.5}" y="${padT}" width="${WW-1}" height="${WH}" rx="1.5" fill="${tones.has(k)?'#d2684f':'#f4e7d4'}" stroke="#c8b8a8" stroke-width="0.75"/>`;
      wi++;
    }
  }
  for (let oct = 0; oct < 2; oct++) {
    for (const semi of BLACK_SEMIS_C) {
      const a = tones.has(semi);
      const wBoundary = {1:1,3:2,6:4,8:5,10:6}[semi];
      const x = oct*(WW*7) + wBoundary*WW - BW/2;
      s += `<rect x="${x}" y="${padT}" width="${BW}" height="${BH}" rx="1" fill="${a?'#d2684f':'#2a1f14'}" stroke="${a?'#b8553e':'#1a110a'}" stroke-width="0.5"/>`;
    }
  }
  return s + '</svg>';
}
