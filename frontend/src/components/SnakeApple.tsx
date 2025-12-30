import React, { useEffect, useState } from "react";

/* ================= CONFIG ================= */
const GRID = 20;
const CELL = 22;

// Make the game start very slow (large delay) and get faster as the snake grows.
// Adjust these to tune "how slow initially" and "how fast it becomes".
const BASE_SPEED = 700; // initial delay (ms) when snake length = 1 => very slow
const SPEED_STEP = 35;  // ms less per extra segment (linear speed-up)
const MIN_SPEED = 80;   // lower bound for delay (fastest possible tick)

type Point = { x: number; y: number };

const randomPoint = (): Point => ({
  x: Math.floor(Math.random() * GRID),
  y: Math.floor(Math.random() * GRID),
});

/* safe random that avoids points in `avoid` */
const randomPointSafe = (avoid: Point[]): Point => {
  let tries = 0;
  while (tries < 1000) {
    const p = randomPoint();
    if (!avoid.some(a => a.x === p.x && a.y === p.y)) return p;
    tries++;
  }
  // fallback if extremely unlucky
  return { x: 0, y: 0 };
};

/* ================= COMPONENT ================= */
export default function SnakeApple() {
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [dir, setDir] = useState<Point>({ x: 1, y: 0 });
  const [apple, setApple] = useState<Point>(() => randomPointSafe([{ x: 10, y: 10 }]));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(false);

  // Controls: keyboard input (prevents reversing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!gameStarted) return;
      if (e.key === "ArrowUp" && dir.y === 0) setDir({ x: 0, y: -1 });
      if (e.key === "ArrowDown" && dir.y === 0) setDir({ x: 0, y: 1 });
      if (e.key === "ArrowLeft" && dir.x === 0) setDir({ x: -1, y: 0 });
      if (e.key === "ArrowRight" && dir.x === 0) setDir({ x: 1, y: 0 });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dir, gameStarted]);

  // Game loop using setInterval that adjusts speed as snake grows
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    // compute dynamic speed: each segment reduces delay a bit
    const length = snake.length;
    const speed = Math.max(MIN_SPEED, BASE_SPEED - (length - 1) * SPEED_STEP);

    const timer = setInterval(() => {
      setSnake(prev => {
        const head = prev[0];
        const next = { x: head.x + dir.x, y: head.y + dir.y };

        // wall hit -> game over
        if (next.x < 0 || next.y < 0 || next.x >= GRID || next.y >= GRID) {
          setGameOver(true);
          setGameStarted(false);
          return prev;
        }

        // self hit -> game over
        if (prev.some(p => p.x === next.x && p.y === next.y)) {
          setGameOver(true);
          setGameStarted(false);
          return prev;
        }

        const newSnake = [next, ...prev];

        // apple eaten
        if (next.x === apple.x && next.y === apple.y) {
          setScore(s => s + 1);
          // spawn apple not on snake
          setApple(randomPointSafe(newSnake));
          // do not pop tail => snake grows
        } else {
          // normal move
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(timer);
  }, [dir, gameStarted, apple, gameOver, snake.length]);

  // start game (with short loading screen)
  const startGame = () => {
    setLoading(true);
    setTimeout(() => {
      setSnake([{ x: 10, y: 10 }]);
      setDir({ x: 1, y: 0 });
      setApple(randomPointSafe([{ x: 10, y: 10 }]));
      setScore(0);
      setGameOver(false);
      setLoading(false);
      setGameStarted(true);
    }, 700);
  };

  // restart / back to start
  const reset = () => {
    setGameStarted(false);
    setGameOver(false);
    setLoading(false);
    setSnake([{ x: 10, y: 10 }]);
    setDir({ x: 1, y: 0 });
    setApple(randomPointSafe([{ x: 10, y: 10 }]));
    setScore(0);
  };

  /* ================= UI (old UI look & different background color) ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 to-cyan-300 flex flex-col items-center justify-center text-slate-900 relative overflow-hidden p-6">
      <style>{`
        /* button pop animation */
        @keyframes pop {
          0% { transform: scale(0.96); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
          50% { transform: scale(1.06); box-shadow: 0 16px 40px rgba(0,0,0,0.12); }
          100% { transform: scale(1); box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
        }
        .animate-pop { animation: pop 420ms ease; }
        /* subtle button gradient shimmer */
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .bg-shimmer {
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* Header */}
      <h1 className="text-6xl font-black italic mb-6 tracking-tighter text-slate-900 drop-shadow-[0_8px_20px_rgba(16,185,129,0.08)]">
        SNAKE <span className="text-emerald-600">&</span> APPLE
      </h1>

      {/* Score */}
      <div className="mb-4 flex gap-6 items-center">
        <div className="text-slate-700 font-black uppercase tracking-widest">Score</div>
        <div className="text-3xl font-extrabold text-emerald-600">{score}</div>
      </div>

      {/* Board */}
      <div
        className="relative rounded-2xl border-2 border-slate-300 shadow-lg bg-white"
        style={{ width: GRID * CELL, height: GRID * CELL }}
      >
        {/* subtle grid glow */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, rgba(34,197,94,0.03), transparent 70%)" }} />

        {/* Apple */}
        <div
          className="absolute rounded-full bg-red-500 shadow-md"
          style={{
            width: CELL - 2,
            height: CELL - 2,
            left: apple.x * CELL + 1,
            top: apple.y * CELL + 1,
          }}
        />

        {/* Snake */}
        {snake.map((p, i) => (
          <div
            key={`${p.x}-${p.y}-${i}`}
            className={`absolute rounded-md transition-all ${i === 0 ? "bg-emerald-400 shadow-[0_6px_18px_rgba(16,185,129,0.18)]" : "bg-emerald-700"}`}
            style={{
              width: CELL - 2,
              height: CELL - 2,
              left: p.x * CELL + 1,
              top: p.y * CELL + 1,
            }}
          />
        ))}
      </div>

      {/* Controls / Buttons */}
      <div className="mt-6 flex gap-4">
        {!gameStarted && !gameOver && !loading && (
          <button
            onClick={() => { startGame(); /* play pop animation by toggling class briefly */ }}
            className="px-8 py-4 rounded-full font-black shadow-lg text-white bg-gradient-to-r from-pink-500 via-yellow-400 to-emerald-400 bg-shimmer hover:scale-105 transform transition"
            onMouseDown={(e) => (e.currentTarget.classList.add("animate-pop"))}
            onAnimationEnd={(e) => e.currentTarget.classList.remove("animate-pop")}
          >
            PLAY NOW
          </button>
        )}

        {loading && (
          <div className="px-6 py-3 rounded-full border border-slate-200 bg-white/80">
            <div className="text-sm font-bold text-slate-800">Loading...</div>
          </div>
        )}

        {gameOver && (
          <>
            <div className="px-6 py-3 rounded-full bg-red-500 font-black text-white">GAME OVER</div>
            <button
              onClick={reset}
              className="px-6 py-3 bg-white text-slate-900 rounded-full font-black shadow hover:scale-105 transition transform"
              onMouseDown={(e) => (e.currentTarget.classList.add("animate-pop"))}
              onAnimationEnd={(e) => e.currentTarget.classList.remove("animate-pop")}
            >
              RESTART
            </button>
          </>
        )}
      </div>

      {/* Instructions */}
      <p className="mt-6 text-slate-700 uppercase tracking-widest text-sm">Use Arrow Keys</p>
    </div>
  );
}