import { Link, Navigate, useParams } from "react-router-dom";
import type { Instrument } from "../types";

const VALID: Instrument[] = ["bass", "guitar"];

const TITLE: Record<Instrument, string> = {
  bass: "Bass",
  guitar: "Guitar",
};

/**
 * Per-instrument landing page with the two areas from the plan: Training and
 * Tools. Phase 0 shows the structure; lessons (Phase 2) and tools (Phase 1)
 * fill in the cards.
 */
export default function InstrumentHome() {
  const { instrument } = useParams<{ instrument: string }>();

  if (!instrument || !VALID.includes(instrument as Instrument)) {
    return <Navigate to="/" replace />;
  }
  const inst = instrument as Instrument;

  return (
    <main className="screen">
      <header className="screen__header screen__header--row">
        <Link to="/" className="back">
          ← Profiles
        </Link>
        <h1>{TITLE[inst]}</h1>
      </header>

      <div className="cards">
        <div className="card card--static">
          <span className="card__emoji">📚</span>
          <span className="card__title">Training</span>
          <span className="card__subtitle">
            Structured lessons with live feedback
          </span>
          <span className="badge">Coming in Phase 2</span>
        </div>

        <div className="card card--static">
          <span className="card__emoji">🛠️</span>
          <span className="card__title">Tools</span>
          <span className="card__subtitle">
            Tuner · metronome · fretboard · songs
          </span>
          <span className="badge">Coming in Phase 1</span>
        </div>
      </div>
    </main>
  );
}
