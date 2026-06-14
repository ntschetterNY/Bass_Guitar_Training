import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import HealthBadge from "../components/HealthBadge";
import type { Instrument, Profile } from "../types";

const INSTRUMENT_META: Record<
  Instrument,
  { emoji: string; tagline: string }
> = {
  bass: { emoji: "🎸", tagline: "Low end, single notes, groove" },
  guitar: { emoji: "🎶", tagline: "Chords, strumming, songs" },
};

export default function Home() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .profiles()
      .then(setProfiles)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <main className="screen">
      <header className="screen__header">
        <h1>Bass &amp; Guitar Training</h1>
        <p className="muted">Choose your instrument to start practicing.</p>
      </header>

      {error && <p className="error">Couldn’t load profiles: {error}</p>}

      <div className="cards">
        {(profiles ?? []).map((p) => {
          const meta = INSTRUMENT_META[p.instrument];
          return (
            <button
              key={p.id}
              className="card"
              onClick={() => navigate(`/${p.instrument}`)}
            >
              <span className="card__emoji">{meta.emoji}</span>
              <span className="card__title">{p.name}</span>
              <span className="card__subtitle">{meta.tagline}</span>
            </button>
          );
        })}
        {profiles === null && !error && <p className="muted">Loading…</p>}
      </div>

      <footer className="screen__footer">
        <HealthBadge />
      </footer>
    </main>
  );
}
