import { useEffect, useRef, useState } from "react";

/**
 * RMS input level (0..1) from an analyser, sampled ~20 fps. Used by the input
 * meter so you can confirm the Focusrite signal is coming through.
 */
export function useLevel(analyser: AnalyserNode | null): number {
  const [level, setLevel] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!analyser) {
      setLevel(0);
      return;
    }
    const buf = new Float32Array(analyser.fftSize);
    let last = 0;
    const tick = (t: number) => {
      raf.current = requestAnimationFrame(tick);
      if (t - last < 50) return; // ~20 fps
      last = t;
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      // Light smoothing for a less jittery meter.
      setLevel((prev) => prev * 0.6 + Math.min(1, rms * 3) * 0.4);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [analyser]);

  return level;
}
