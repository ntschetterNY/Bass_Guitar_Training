import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import InstrumentHome from "./pages/InstrumentHome";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/:instrument" element={<InstrumentHome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
