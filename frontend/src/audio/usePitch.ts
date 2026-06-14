import { useEffect, useRef, useState } from "react";
import { PitchDetector } from "pitchy";
import { freqToNote, PITCH_RANGE, type InstrumentId, type NoteReading } from "./notes";

export interface PitchReading {
  freq: number;
  clarity: number;
  note: NoteReading;
}

interface Options {
  /** Minimum clarity (0..1) to accept a reading. */
  minClarity?: number;
  /** Minimum RMS to treat as a real note rather than background noise. */
  minRms?: number;
}

/**
 * Real-time monophonic pitch detection (bass / single guitar strings) using
 * pitchy's McLeod method on the analyser's time-domain data. Reliable down to
 * low E (~41 Hz) with a 4096-sample window.
 */
export function usePitch(
  analyser: AnalyserNode | null,
  instrument: InstrumentId,
  { minClarity = 0.92, minRms = 0.008 }: Options = {},
): PitchReading | null {
  const [reading, setReading] = useState<PitchReading | null>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!analyser) {
      setReading(null);
      return;
    }
    analyser.fftSize = 4096;
    const sampleRate = analyser.context.sampleRate;
    const detector = PitchDetector.forFloat32Array(analyser.fftSize);
    detector.minVolumeAbsolute = minRms;
    const buf = new Float32Array(detector.inputLength);
    const range = PITCH_RANGE[instrument];

    let last = 0;
    const tick = (t: number) => {
      raf.current = requestAnimationFrame(tick);
      if (t - last < 40) return; // ~25 fps is plenty for a stable readout
      last = t;
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      if (rms < minRms) {
        setReading(null);
        return;
      }
      const [freq, clarity] = detector.findPitch(buf, sampleRate);
      if (clarity < minClarity || freq < range.min || freq > range.max) {
        setReading(null);
        return;
      }
      setReading({ freq, clarity, note: freqToNote(freq) });
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [analyser, instrument, minClarity, minRms]);

  return reading;
}
