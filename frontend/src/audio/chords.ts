// Lightweight chord detection for guitar: build a 12-bin chromagram from the
// analyser's frequency data and match it against chord templates with cosine
// similarity. This is the pragmatic "template match against known chords"
// approach from the plan — good on clean major/minor, weaker on 7ths/distortion.

import { NOTE_NAMES } from "./notes";

interface Quality {
  suffix: string;
  intervals: number[];
}

const QUALITIES: Quality[] = [
  { suffix: "", intervals: [0, 4, 7] }, // major
  { suffix: "m", intervals: [0, 3, 7] }, // minor
  { suffix: "7", intervals: [0, 4, 7, 10] }, // dominant 7
  { suffix: "m7", intervals: [0, 3, 7, 10] }, // minor 7
  { suffix: "maj7", intervals: [0, 4, 7, 11] }, // major 7
];

export interface ChordTemplate {
  name: string;
  /** Normalised 12-bin pitch-class vector. */
  vector: number[];
}

function buildTemplates(): ChordTemplate[] {
  const templates: ChordTemplate[] = [];
  for (let root = 0; root < 12; root++) {
    for (const q of QUALITIES) {
      const vec = new Array(12).fill(0);
      for (const interval of q.intervals) vec[(root + interval) % 12] = 1;
      templates.push({
        name: `${NOTE_NAMES[root]}${q.suffix}`,
        vector: normalize(vec),
      });
    }
  }
  return templates;
}

function normalize(v: number[]): number[] {
  const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return mag === 0 ? v : v.map((x) => x / mag);
}

const TEMPLATES = buildTemplates();

/**
 * Build a chromagram (energy per pitch class) from analyser frequency data.
 * @param freqData getFloatFrequencyData output (dB values, length = fftSize/2)
 */
export function computeChroma(
  freqData: Float32Array,
  sampleRate: number,
  fftSize: number,
  minFreq = 70,
  maxFreq = 2000,
): number[] {
  const chroma = new Array(12).fill(0);
  const binHz = sampleRate / fftSize;
  const startBin = Math.max(1, Math.floor(minFreq / binHz));
  const endBin = Math.min(freqData.length - 1, Math.ceil(maxFreq / binHz));
  for (let i = startBin; i <= endBin; i++) {
    const db = freqData[i];
    if (db < -90) continue; // skip the noise floor
    const mag = Math.pow(10, db / 20);
    const freq = i * binHz;
    const pitchClass = ((Math.round(12 * Math.log2(freq / 440)) % 12) + 12 + 9) % 12;
    chroma[pitchClass] += mag;
  }
  return chroma;
}

export interface ChordMatch {
  name: string;
  /** Cosine similarity 0..1. */
  score: number;
}

export function matchChord(chroma: number[]): ChordMatch | null {
  const total = chroma.reduce((s, x) => s + x, 0);
  if (total <= 0) return null;
  const norm = normalize(chroma);
  let best: ChordMatch | null = null;
  for (const t of TEMPLATES) {
    let dot = 0;
    for (let i = 0; i < 12; i++) dot += norm[i] * t.vector[i];
    if (!best || dot > best.score) best = { name: t.name, score: dot };
  }
  return best;
}
