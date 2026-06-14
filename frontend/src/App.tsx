import { Navigate, Route, Routes } from "react-router-dom";
import { AudioProvider } from "./audio/AudioProvider";
import Home from "./pages/Home";
import InstrumentHome from "./pages/InstrumentHome";
import LiveDetector from "./tools/LiveDetector";
import Metronome from "./tools/Metronome";
import NoteTrainer from "./tools/NoteTrainer";
import ToolsHome from "./tools/ToolsHome";
import Tuner from "./tools/Tuner";

export default function App() {
  return (
    <AudioProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:instrument" element={<InstrumentHome />} />
        <Route path="/:instrument/tools" element={<ToolsHome />} />
        <Route path="/:instrument/tools/tuner" element={<Tuner />} />
        <Route path="/:instrument/tools/metronome" element={<Metronome />} />
        <Route path="/:instrument/tools/note-trainer" element={<NoteTrainer />} />
        <Route path="/:instrument/tools/live" element={<LiveDetector />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AudioProvider>
  );
}
