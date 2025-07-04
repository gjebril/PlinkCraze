// import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Game } from "./pages/Game";
import { Simulation } from "./pages/Simulation";
import { Home } from "./pages/Home";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
