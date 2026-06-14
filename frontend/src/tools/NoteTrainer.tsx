import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAudio } from "../audio/AudioProvider";
import InputControls from "../audio/InputControls";
import { fretToMidi, midiToLabel, TUNINGS, type InstrumentId } from "../audio/notes";
import { usePitch } from "../audio/usePitch";
import ToolHeader from "./ToolHeader";
import { useInstrument } from "./useInstrument";

const MAX_FRET = 5;
// Consecutive on-pitch frames required to count as "played" (debounce).
const CONFIRM_FRAMES = 3;

interface Target {
  midi: number;
  label: string;
  stringLabel: string;
  fret: number;
}

function randomTarget(instrument: InstrumentId): Target {
  const strings = TUNINGS[instrument];
  const s = strings[Math.floor(Math.random() * strings.length)];
  const fret = Math.floor(Math.random() * (MAX_FRET + 1));
  const midi = fretToMidi(s.midi, fret);
  return { midi, label: midiToLabel(midi), stringLabel: s.label, fret };
}

export default function NoteTrainer() {
  const instrument = useInstrument();
  const { analyser, status } = useAudio();
  const reading = usePitch(analyser, instrument ?? "bass");

  const [target, setTarget] = useState<Target | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [justHit, setJustHit] = useState(false);
  const confirmRef = useRef(0);

  const next = useCallback(() => {
    if (instrument) setTarget(randomTarget(instrument));
    confirmRef.current = 0;
  }, [instrument]);

  // Start once audio is running and we don't yet have a target.
  useEffect(() => {
    if (status === "running" && !target) next();
  }, [status, target, next]);

  // Detection loop: count consecutive matching frames, then advance.
  useEffect(() => {
    if (!target || !reading) {
      return;
    }
    if (reading.note.midi === target.midi) {
      confirmRef.current += 1;
      if (confirmRef.current >= CONFIRM_FRAMES) {
        confirmRef.current = 0;
        setScore((s) => s + 1);
        setStreak((s) => s + 1);
        setJustHit(true);
        window.setTimeout(() => setJustHit(false), 450);
        next();
      }
    } else {
      confirmRef.current = 0;
    }
  }, [reading, target, next]);

  if (!instrument) return <Navigate to="/" replace />;

  const matched = target && reading?.note.midi === target.midi;

  return (
    <main className="screen">
      <ToolHeader instrument={instrument} title="Note Trainer" />
      <InputControls />

      <section className="trainer">
        <div className="trainer__stats">
          <span>Score: {score}</span>
          <span>Streak: {streak}</span>
        </div>

        {status !== "running" ? (
          <p className="muted">Enable input to start the drill.</p>
        ) : target ? (
          <div className={`trainer__card ${justHit ? "trainer__card--hit" : ""}`}>
            <span className="muted small">Play this note</span>
            <span className="trainer__target">{target.label}</span>
            <span className="muted">
              {target.stringLabel} string · fret {target.fret}
            </span>
            <div className={`trainer__feedback ${matched ? "ok" : ""}`}>
              {justHit
                ? "✅ Nice!"
                : reading
                  ? `Heard ${reading.note.label}`
                  : "Listening…"}
            </div>
          </div>
        ) : null}

        <div className="trainer__actions">
          <button className="btn" onClick={next} disabled={status !== "running"}>
            Skip
          </button>
          <button
            className="btn"
            onClick={() => {
              setScore(0);
              setStreak(0);
              next();
            }}
            disabled={status !== "running"}
          >
            Reset
          </button>
        </div>
      </section>
    </main>
  );
}
