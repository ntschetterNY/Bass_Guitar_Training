import { Link, Navigate } from "react-router-dom";
import { useInstrument } from "./useInstrument";

export default function ToolsHome() {
  const instrument = useInstrument();
  if (!instrument) return <Navigate to="/" replace />;

  const isGuitar = instrument === "guitar";
  const tools = [
    { to: "tuner", emoji: "🎯", title: "Tuner", subtitle: "Tune each string" },
    { to: "metronome", emoji: "🥁", title: "Metronome", subtitle: "Keep time" },
    {
      to: "note-trainer",
      emoji: "🎼",
      title: "Note Trainer",
      subtitle: "Fretboard drill with live feedback",
    },
    {
      to: "live",
      emoji: "🔎",
      title: isGuitar ? "Chord Detector" : "Note Detector",
      subtitle: isGuitar ? "What chord am I playing?" : "What note am I playing?",
    },
  ];

  return (
    <main className="screen">
      <header className="screen__header screen__header--row">
        <Link to={`/${instrument}`} className="back">
          ← {instrument === "bass" ? "Bass" : "Guitar"}
        </Link>
        <h1>Tools</h1>
      </header>

      <div className="cards">
        {tools.map((t) => (
          <Link key={t.to} to={t.to} className="card">
            <span className="card__emoji">{t.emoji}</span>
            <span className="card__title">{t.title}</span>
            <span className="card__subtitle">{t.subtitle}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
