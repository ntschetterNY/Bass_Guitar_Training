import { useEffect, useRef, useState } from "react";
import { computeChroma, matchChord, type ChordMatch } from "./chords";

interface Options {
  /** Minimum cosine similarity to report a chord. */
  minScore?: number;
  /** Frames the same chord must persist before it's reported (debounce). */
  holdFrames?: number;
}

/**
 * Experimental polyphonic chord detection for guitar: chromagram + template
 * match, debounced over a few frames. Good on clean major/minor; weaker on
 * 7ths and distortion (per the plan's research).
 */
export function useChord(
  analyser: AnalyserNode | null,
  { minScore = 0.86, holdFrames = 3 }: Options = {},
): ChordMatch | null {
  const [chord, setChord] = useState<ChordMatch | null>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!analyser) {
      setChord(null);
      return;
    }
    // Larger window -> better low-frequency bin resolution for the chromagram.
    analyser.fftSize = 16384;
    const sampleRate = analyser.context.sampleRate;
    const fftSize = analyser.fftSize;
    const freqData = new Float32Array(analyser.frequencyBinCount);

    let candidate: string | null = null;
    let count = 0;
    let last = 0;
    const tick = (t: number) => {
      raf.current = requestAnimationFrame(tick);
      if (t - last < 80) return; // ~12 fps
      last = t;
      analyser.getFloatFrequencyData(freqData);
      const chroma = computeChroma(freqData, sampleRate, fftSize);
      const match = matchChord(chroma);
      if (!match || match.score < minScore) {
        candidate = null;
        count = 0;
        setChord(null);
        return;
      }
      if (match.name === candidate) {
        count += 1;
      } else {
        candidate = match.name;
        count = 1;
      }
      if (count >= holdFrames) setChord(match);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [analyser, minScore, holdFrames]);

  return chord;
}
