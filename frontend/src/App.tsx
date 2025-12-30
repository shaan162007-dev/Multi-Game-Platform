import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GameHub from "./components/GameHub.tsx";
import TicTacToe from "./components/TicTacToe.tsx";
import HandCricket from "./components/HandCricket.tsx";
import Uno from "./components/uno/UnoGame.tsx";
import SnakeApple from "./components/SnakeApple.tsx";
import SnakeLadder from "./components/SnakeLadder.tsx";
import Ludo from "./components/Ludo.tsx";
import MathGame from "./components/MathGame.tsx";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GameHub />} />
        <Route path="/tic-tac-toe" element={<TicTacToe />} />
        <Route path="/hand-cricket" element={<HandCricket />} />
        <Route path="/ludo" element={<Ludo />} />
        <Route path="/uno" element={<Uno />} />
        <Route path="/snake-apple" element={<SnakeApple />} />
        <Route path="/snake-ladder" element={<SnakeLadder />} />
        <Route path="/math-game" element={<MathGame />} />

      </Routes>
    </Router>
  );
}

export default App;
