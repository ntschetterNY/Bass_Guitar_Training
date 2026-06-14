export type Instrument = "bass" | "guitar";

export interface Profile {
  id: number;
  name: string;
  instrument: Instrument;
  created_at: string;
}
