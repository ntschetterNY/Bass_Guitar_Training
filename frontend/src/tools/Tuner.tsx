import { Navigate } from "react-router-dom";
import { useAudio } from "../audio/AudioProvider";
import InputControls from "../audio/InputControls";
import { TUNINGS } from "../audio/notes";
import { usePitch } from "../audio/usePitch";
import ToolHeader from "./ToolHeader";
import { useInstrument } from "./useInstrument";

export default function Tuner() {
  const instrument = useInstrument();
  const { analyser } = useAudio();
  const reading = usePitch(analyser, instrument ?? "bass");

  if (!instrument) return <Navigate to="/" replace />;

  const cents = reading?.note.cents ?? 0;
  const inTune = reading != null && Math.abs(cents) <= 5;
  // Clamp the needle to the visible -50..+50 range.
  const needle = Math.max(-50, Math.min(50, cents));
  const strings = TUNINGS[instrument];
  const nearestMidi = reading?.note.midi;

  return (
    <main className="screen">
      <ToolHeader instrument={instrument} title="Tuner" />
      <InputControls />

      <section className="tuner">
        <div className={`tuner__note ${inTune ? "tuner__note--ok" : ""}`}>
          {reading ? reading.note.label : "—"}
        </div>

        <div className="tuner__gauge">
          <div className="tuner__center" />
          {reading && (
            <div
              className={`tuner__needle ${inTune ? "tuner__needle--ok" : ""}`}
              style={{ left: `calc(50% + ${needle * 0.9}%)` }}
            />
          )}
        </div>
        <div className="tuner__scale">
          <span>♭ flat</span>
          <span>{reading ? `${cents > 0 ? "+" : ""}${cents}¢` : ""}</span>
          <span>sharp ♯</span>
        </div>

        <p className="muted small">
          Play one string at a time. Target tuning:
        </p>
        <div className="string-row">
          {strings.map((s) => (
            <span
              key={s.label}
              className={`pill ${s.midi === nearestMidi ? "pill--active" : ""}`}
            >
              {s.label}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
