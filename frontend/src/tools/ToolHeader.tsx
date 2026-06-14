import { Link } from "react-router-dom";
import type { InstrumentId } from "../audio/notes";

export default function ToolHeader({
  instrument,
  title,
}: {
  instrument: InstrumentId;
  title: string;
}) {
  return (
    <header className="screen__header screen__header--row">
      <Link to={`/${instrument}/tools`} className="back">
        ← Tools
      </Link>
      <h1>{title}</h1>
    </header>
  );
}
