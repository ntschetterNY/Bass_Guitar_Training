import { Navigate } from "react-router-dom";
import { useAudio } from "../audio/AudioProvider";
import InputControls from "../audio/InputControls";
import { useChord } from "../audio/useChord";
import { usePitch } from "../audio/usePitch";
import ToolHeader from "./ToolHeader";
import { useInstrument } from "./useInstrument";

/**
 * "What am I playing": single-note readout for bass, chord readout for guitar.
 * Bass uses monophonic pitch detection; guitar uses the experimental
 * chromagram chord matcher.
 */
export default function LiveDetector() {
  const instrument = useInstrument();
  const { analyser, status } = useAudio();
  const isGuitar = instrument === "guitar";

  // Only one detector runs at a time (they fight over analyser.fftSize), so we
  // pass a null analyser to the one we don't want active.
  const note = usePitch(isGuitar ? null : analyser, instrument ?? "bass");
  const chord = useChord(isGuitar ? analyser : null);

  if (!instrument) return <Navigate to="/" replace />;

  return (
    <main className="screen">
      <ToolHeader
        instrument={instrument}
        title={isGuitar ? "Chord Detector" : "Note Detector"}
      />
      <InputControls />

      <section className="detector">
        {status !== "running" ? (
          <p className="muted">Enable input and play.</p>
        ) : isGuitar ? (
          <>
            <div className="detector__big">{chord ? chord.name : "—"}</div>
            <p className="muted small">
              {chord
                ? `confidence ${(chord.score * 100).toFixed(0)}%`
                : "Strum a chord and hold it"}
            </p>
            <p className="muted small">
              Experimental — most reliable on clean major/minor chords.
            </p>
          </>
        ) : (
          <>
            <div className="detector__big">{note ? note.note.label : "—"}</div>
            <p className="muted small">
              {note
                ? `${note.freq.toFixed(1)} Hz · ${note.note.cents > 0 ? "+" : ""}${note.note.cents}¢`
                : "Play a single note"}
            </p>
          </>
        )}
      </section>
    </main>
  );
}
