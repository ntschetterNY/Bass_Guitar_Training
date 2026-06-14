// Music/pitch helpers shared by the tuner, note trainer, and live detector.

export const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

const A4 = 440;
const A4_MIDI = 69;

export function freqToMidiFloat(freq: number): number {
  return A4_MIDI + 12 * Math.log2(freq / A4);
}

export function midiToFreq(midi: number): number {
  return A4 * Math.pow(2, (midi - A4_MIDI) / 12);
}

export interface NoteReading {
  /** Nearest MIDI note number. */
  midi: number;
  /** Note name without octave, e.g. "A#". */
  name: string;
  /** Name with octave, e.g. "A#2". */
  label: string;
  octave: number;
  /** Cents away from the nearest note (-50..+50); 0 = perfectly in tune. */
  cents: number;
}

export function midiToLabel(midi: number): string {
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

export function freqToNote(freq: number): NoteReading {
  const midiFloat = freqToMidiFloat(freq);
  const midi = Math.round(midiFloat);
  const cents = Math.round((midiFloat - midi) * 100);
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return { midi, name, label: `${name}${octave}`, octave, cents };
}

export type InstrumentId = "bass" | "guitar";

export interface GuitarString {
  /** Display label, e.g. "E1" (low) … */
  label: string;
  /** Open-string MIDI note. */
  midi: number;
}

// Standard tunings (low -> high). 4-string bass and 6-string guitar.
export const TUNINGS: Record<InstrumentId, GuitarString[]> = {
  bass: [
    { label: "E1", midi: 28 },
    { label: "A1", midi: 33 },
    { label: "D2", midi: 38 },
    { label: "G2", midi: 43 },
  ],
  guitar: [
    { label: "E2", midi: 40 },
    { label: "A2", midi: 45 },
    { label: "D3", midi: 50 },
    { label: "G3", midi: 55 },
    { label: "B3", midi: 59 },
    { label: "E4", midi: 64 },
  ],
};

/** Pitch range each instrument can realistically produce (for noise gating). */
export const PITCH_RANGE: Record<InstrumentId, { min: number; max: number }> = {
  // Low E1 ~41 Hz up to ~24th fret on the G string (~392 Hz) plus headroom.
  bass: { min: 35, max: 600 },
  // Low E2 ~82 Hz up to high frets (~1320 Hz) plus headroom.
  guitar: { min: 70, max: 1400 },
};

/** MIDI note for a given open string and fret. */
export function fretToMidi(openMidi: number, fret: number): number {
  return openMidi + fret;
}
