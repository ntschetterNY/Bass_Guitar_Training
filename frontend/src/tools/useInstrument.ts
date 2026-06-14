import { useParams } from "react-router-dom";
import type { InstrumentId } from "../audio/notes";

/** Reads and validates the :instrument route param. */
export function useInstrument(): InstrumentId | null {
  const { instrument } = useParams<{ instrument: string }>();
  return instrument === "bass" || instrument === "guitar" ? instrument : null;
}
