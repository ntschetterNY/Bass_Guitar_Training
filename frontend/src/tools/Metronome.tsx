import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import ToolHeader from "./ToolHeader";
import { useInstrument } from "./useInstrument";

// Look-ahead scheduler (Chris Wilson's pattern): schedule clicks slightly ahead
// of time on the Web Audio clock for rock-solid timing regardless of the UI.
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.1; // seconds

export default function Metronome() {
  const instrument = useInstrument();
  const [bpm, setBpm] = useState(90);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [running, setRunning] = useState(false);
  const [uiBeat, setUiBeat] = useState(-1);

  const ctxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const beatRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  // Keep latest values available to the scheduler without restarting it.
  const bpmRef = useRef(bpm);
  const beatsRef = useRef(beatsPerBar);
  bpmRef.current = bpm;
  beatsRef.current = beatsPerBar;

  function click(time: number, accent: boolean) {
    const ctx = ctxRef.current!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1500 : 1000;
    gain.gain.setValueAtTime(accent ? 0.6 : 0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.06);
  }

  function scheduler() {
    const ctx = ctxRef.current!;
    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD) {
      const beat = beatRef.current;
      click(nextNoteTimeRef.current, beat === 0);
      const thisBeat = beat;
      const when = (nextNoteTimeRef.current - ctx.currentTime) * 1000;
      window.setTimeout(() => setUiBeat(thisBeat), Math.max(0, when));

      nextNoteTimeRef.current += 60 / bpmRef.current;
      beatRef.current = (beat + 1) % beatsRef.current;
    }
  }

  function startStop() {
    if (running) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      setRunning(false);
      setUiBeat(-1);
      return;
    }
    const ctx =
      ctxRef.current ??
      new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    ctxRef.current = ctx;
    ctx.resume();
    beatRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    timerRef.current = window.setInterval(scheduler, LOOKAHEAD_MS);
    setRunning(true);
  }

  useEffect(
    () => () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      ctxRef.current?.close().catch(() => {});
    },
    [],
  );

  if (!instrument) return <Navigate to="/" replace />;

  return (
    <main className="screen">
      <ToolHeader instrument={instrument} title="Metronome" />

      <section className="metronome">
        <div className="beats">
          {Array.from({ length: beatsPerBar }).map((_, i) => (
            <span
              key={i}
              className={`beat ${i === uiBeat ? "beat--on" : ""} ${
                i === 0 ? "beat--accent" : ""
              }`}
            />
          ))}
        </div>

        <div className="bpm">{bpm} BPM</div>
        <input
          type="range"
          min={40}
          max={240}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
        />

        <div className="metronome__controls">
          <label className="field">
            Beats / bar
            <select
              className="select"
              value={beatsPerBar}
              onChange={(e) => setBeatsPerBar(Number(e.target.value))}
            >
              {[2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            className={`btn ${running ? "" : "btn--primary"}`}
            onClick={startStop}
          >
            {running ? "Stop" : "Start"}
          </button>
        </div>
      </section>
    </main>
  );
}
