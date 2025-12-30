import React, { useEffect, useRef, useState } from "react";

/* ================= CONFIG ================= */
const BOARD_SIZE = 10; // 10x10 board
const CELL_PX = 48; // visual cell size in px
const TOKEN_SIZE = 26; // pixel size of pawn rendered above board

type PlayerDef = { name: string; isCPU: boolean; color: string };
type SnakeDef = { from: number; to: number; size: "large" | "small" };
type LadderDef = { from: number; to: number };

const SNAKES: SnakeDef[] = [
  { from: 98, to: 28, size: "large" },
  { from: 95, to: 24, size: "large" },
  { from: 83, to: 19, size: "large" },
  { from: 69, to: 33, size: "small" },
  { from: 73, to: 1, size: "small" },
];

const LADDERS: LadderDef[] = [
  { from: 4, to: 25 },
  { from: 13, to: 46 },
  { from: 27, to: 56 },
  { from: 33, to: 70 },
  { from: 42, to: 63 },
  { from: 50, to: 91 },
];

const CPU_NAME_POOL = ["Aditi", "Arpan", "Joti", "Shreshtha", "Raj", "Kallu"];
const COLOR_POOL = ["Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Violet"];
const COLOR_MAP: Record<string, string> = {
  Red: "#ef4444",
  Orange: "#fb923c",
  Yellow: "#f59e0b",
  Green: "#84cc16",
  Blue: "#38bdf8",
  Indigo: "#6366f1",
  Violet: "#7c3aed",
};

/* ================= HELPERS ================= */
// convert board number (1..100) into top-row/col coordinates for layout
function cellToCoords(num: number) {
  const n = Math.max(1, Math.min(100, num));
  const idx = n - 1;
  const rowFromBottom = Math.floor(idx / BOARD_SIZE); // 0..9 from bottom
  const row = BOARD_SIZE - 1 - rowFromBottom; // top-based row for rendering
  const withinRowIndex = idx % BOARD_SIZE;
  const col = rowFromBottom % 2 === 0 ? withinRowIndex : BOARD_SIZE - 1 - withinRowIndex;
  return { row, col, rowFromBottom };
}

/* ================= COMPONENT ================= */
export default function SnakeLadder() {
  const [setupOpen, setSetupOpen] = useState(true);
  const [cpuCount, setCpuCount] = useState(2);
  const [humanColor, setHumanColor] = useState<string>("Red");
  const [playerOrder, setPlayerOrder] = useState<PlayerDef[]>([]);

  // positions: 0 = off-board (need 6 to enter), 1..100 on board
  const [positions, setPositions] = useState<number[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [diceFace, setDiceFace] = useState<number | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [message, setMessage] = useState("Configure players and start");
  const [won, setWon] = useState(false);

  // animation / visual states
  const [animating, setAnimating] = useState<{ type: "ladder" | "snake" | null; playerIdx?: number }>({ type: null });
  const [cryingPlayers, setCryingPlayers] = useState<Record<number, boolean>>({});
  const [floatingCPU, setFloatingCPU] = useState<{ visible: boolean; name?: string; top?: number }>({ visible: false });

  // timer refs (cross-env)
  const rollAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cpuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const floatingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scrolling refs
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const playersListRef = useRef<HTMLDivElement>(null);

  const boardWidth = BOARD_SIZE * CELL_PX;
  const boardHeight = BOARD_SIZE * CELL_PX;

  /* ---------------- Setup / Start ---------------- */
  function startGameFromSetup() {
    const cpus = CPU_NAME_POOL.slice(0, cpuCount).map((n, idx) => ({
      name: n.charAt(0).toUpperCase() + n.slice(1),
      isCPU: true,
      color: COLOR_POOL[(idx + 1) % COLOR_POOL.length],
    }));
    const players = [{ name: "You", isCPU: false, color: humanColor }, ...cpus];
    setPlayerOrder(players);
    setPositions(players.map(() => 0)); // off-board
    setTurnIndex(0);
    setDiceFace(null);
    setMessage("Game started — roll a 6 to enter!");
    setWon(false);
    setSetupOpen(false);
    startFloatingCPUs();
    
    // Scroll to board when game starts
    setTimeout(() => {
      if (boardContainerRef.current) {
        boardContainerRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest'
        });
      }
    }, 100);
  }

  /* ---------------- Dice animation ---------------- */
  const rollDiceAnimated = (): Promise<number> =>
    new Promise((resolve) => {
      if (diceRolling) return resolve(1);
      setDiceRolling(true);
      const tick = 80;
      rollAnimRef.current = setInterval(() => {
        setDiceFace(Math.floor(Math.random() * 6) + 1);
      }, tick);

      setTimeout(() => {
        if (rollAnimRef.current) {
          clearInterval(rollAnimRef.current);
          rollAnimRef.current = null;
        }
        const final = Math.floor(Math.random() * 6) + 1;
        setDiceFace(final);
        setDiceRolling(false);
        resolve(final);
      }, 900);
    });

  /* ---------------- Movement logic (6-to-enter, extra turn on 6) ---------------- */
  const movePlayer = (playerIdx: number, roll: number) => {
    const player = playerOrder[playerIdx];
    setMessage(`${player.name} rolled a ${roll}`);
    setPositions((prev) => {
      const copy = [...prev];
      const current = copy[playerIdx];

      if (current === 0) {
        if (roll === 6) {
          copy[playerIdx] = 1;
          setMessage(`${player.name} rolled a 6 and enters at 1`);
        } else {
          setMessage(`${player.name} needs a 6 to enter (rolled ${roll})`);
        }
        return copy;
      }

      let next = current + roll;
      if (next > 100) {
        setMessage(`${player.name} needs exact number to reach 100`);
        return copy;
      }

      // check snake/ladder
      const snakeHit = SNAKES.find(s => s.from === next);
      const ladderHit = LADDERS.find(l => l.from === next);

      if (snakeHit) {
        setAnimating({ type: "snake", playerIdx });
        setTimeout(() => setCryingPlayers(prev => ({ ...prev, [playerIdx]: true })), 400);
        setTimeout(() => setCryingPlayers(prev => ({ ...prev, [playerIdx]: false })), 1600);
        setMessage(`${player.name} got eaten by a snake! Moves to ${snakeHit.to}`);
        next = snakeHit.to;
      } else if (ladderHit) {
        setAnimating({ type: "ladder", playerIdx });
        setTimeout(() => setAnimating({ type: null }), 900);
        setMessage(`${player.name} climbs a ladder to ${ladderHit.to}`);
        next = ladderHit.to;
      } else {
        setMessage(`${player.name} moved to ${next}`);
      }

      copy[playerIdx] = next;
      if (next === 100) {
        setWon(true);
        setMessage(`🎉 ${player.name} WINS!`);
      }
      return copy;
    });
  };

  const takeTurn = async (pIdx: number) => {
    if (diceRolling || won) return;
    setMessage(`${playerOrder[pIdx].name} rolling...`);
    const face = await rollDiceAnimated();

    // after showing dice face, move player and decide next action
    setTimeout(() => {
      movePlayer(pIdx, face);

      // if the roller rolled a 6 and game not won, they get another chance
      const playerIsCPU = playerOrder[pIdx]?.isCPU;

      // we must check win after move. use positions state is async; check local variables:
      // We will schedule advancing turn only if not 6. If 6 and CPU, schedule CPU to roll again.
      if (!won) {
        if (face === 6) {
          setMessage((prevMsg) => {
            // if the player just entered and won, message may have changed; keep informative text
            return `${playerOrder[pIdx].name} rolled a 6 — roll again!`;
          });

          if (playerIsCPU) {
            // schedule CPU extra roll after a short think time
            const think = 600 + Math.random() * 600;
            if (cpuTimerRef.current) {
              clearTimeout(cpuTimerRef.current);
              cpuTimerRef.current = null;
            }
            cpuTimerRef.current = setTimeout(() => {
              takeTurn(pIdx);
            }, think);
          }
          // For human: keep turnIndex same so UI can roll again (button active)
        } else {
          // normal case: pass turn
          setTurnIndex((t) => (t + 1) % playerOrder.length);
        }
      }
    }, 300);
  };

  /* ---------------- CPU auto-play ---------------- */
  useEffect(() => {
    if (setupOpen) return;
    if (won) return;
    if (!playerOrder.length) return;

    const cur = playerOrder[turnIndex];
    if (cur && cur.isCPU) {
      // If diceRolling (maybe extra roll queued) or CPU already rolling, don't schedule another
      if (diceRolling) return;
      const think = 600 + Math.random() * 900;
      cpuTimerRef.current = setTimeout(() => {
        takeTurn(turnIndex);
      }, think);
      return () => {
        if (cpuTimerRef.current) {
          clearTimeout(cpuTimerRef.current);
          cpuTimerRef.current = null;
        }
      };
    }
  }, [turnIndex, playerOrder, setupOpen, won, diceRolling]);

  const onHumanRoll = () => {
    if (setupOpen) return;
    if (won) return;
    if (!playerOrder.length) return;
    if (turnIndex !== 0) {
      setMessage(`Wait — it's ${playerOrder[turnIndex]?.name}'s turn`);
      return;
    }
    takeTurn(0);
  };

  const resetAll = () => {
    setSetupOpen(true);
    setPlayerOrder([]);
    setPositions([]);
    setDiceFace(null);
    setMessage("Configure players and start");
    setWon(false);
    setTurnIndex(0);
    stopFloatingCPUs();
    
    // Scroll to setup when resetting
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  /* ---------------- Floating CPU characters (random appearances) ---------------- */
  function startFloatingCPUs() {
    if (floatingTimerRef.current) {
      clearInterval(floatingTimerRef.current);
      floatingTimerRef.current = null;
    }
    floatingTimerRef.current = setInterval(() => {
      const player = CPU_NAME_POOL[Math.floor(Math.random() * CPU_NAME_POOL.length)];
      setFloatingCPU({
        visible: true,
        name: player,
        top: 6 + Math.random() * 74,
      });
      setTimeout(() => setFloatingCPU({ visible: false }), 1600);
    }, 4500);
  }

  function stopFloatingCPUs() {
    if (floatingTimerRef.current) {
      clearInterval(floatingTimerRef.current);
      floatingTimerRef.current = null;
    }
    setFloatingCPU({ visible: false });
  }

  /* ---------------- Scroll to current player ---------------- */
  const scrollToCurrentPlayer = () => {
    if (playersListRef.current) {
      const currentPlayerElement = playersListRef.current.children[turnIndex];
      if (currentPlayerElement) {
        currentPlayerElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  };

  // Scroll to current player when turn changes
  useEffect(() => {
    if (!setupOpen && !won && playerOrder.length > 0) {
      scrollToCurrentPlayer();
    }
  }, [turnIndex, setupOpen, won, playerOrder.length]);

  useEffect(() => {
    return () => {
      if (rollAnimRef.current) {
        clearInterval(rollAnimRef.current);
        rollAnimRef.current = null;
      }
      if (cpuTimerRef.current) {
        clearTimeout(cpuTimerRef.current);
        cpuTimerRef.current = null;
      }
      if (floatingTimerRef.current) {
        clearInterval(floatingTimerRef.current);
        floatingTimerRef.current = null;
      }
    };
  }, []);

  /* ---------------- Draw connections SVG (visible) ---------------- */
  const renderConnectionsSVG = () => {
    const cellCenter = (num: number) => {
      const { row, col } = cellToCoords(num);
      const cx = col * CELL_PX + CELL_PX / 2;
      const cy = row * CELL_PX + CELL_PX / 2;
      return { cx, cy };
    };

    const snakeGroups = SNAKES.map((s) => {
      const { cx: sx, cy: sy } = cellCenter(s.from);
      const { cx: ex, cy: ey } = cellCenter(s.to);
      const dx = ex - sx;
      const dy = ey - sy;
      const mx = (sx + ex) / 2;
      const my = (sy + ey) / 2;
      const offset = Math.max(60, Math.hypot(dx, dy) / 2.2);
      const nx = -dy;
      const ny = dx;
      const nlen = Math.hypot(nx, ny) || 1;
      const ux = (nx / nlen) * offset;
      const uy = (ny / nlen) * offset;
      const cx1 = mx + ux;
      const cy1 = my + uy;
      const cx2 = mx - ux;
      const cy2 = my - uy;
      const d = `M ${sx},${sy} C ${cx1},${cy1} ${cx2},${cy2} ${ex},${ey}`;
      const strokeW = s.size === "large" ? 18 : 10;
      const innerStrokeW = s.size === "large" ? 10 : 6;
      return (
        <g key={`snake-${s.from}`}>
          <path d={d} stroke="#073b28" strokeWidth={strokeW} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.98} />
          <path d={d} stroke="#10b981" strokeWidth={innerStrokeW} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
          <ellipse cx={ex} cy={ey} rx={12 + (s.size === "large" ? 6 : 0)} ry={8 + (s.size === "large" ? 4 : 0)} fill="#0b4f36" stroke="#05321f" strokeWidth={2} />
          <circle cx={ex + Math.sign(dx) * 6} cy={ey - 6} r={3} fill="#000" />
        </g>
      );
    });

    const ladderGroups = LADDERS.map((l) => {
      const { cx: sx, cy: sy } = cellCenter(l.from);
      const { cx: ex, cy: ey } = cellCenter(l.to);
      const dx = ex - sx;
      const dy = ey - sy;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const px = -uy * 14;
      const py = ux * 14;
      const left1x = sx + px, left1y = sy + py;
      const left2x = ex + px, left2y = ey + py;
      const right1x = sx - px, right1y = sy - py;
      const right2x = ex - px, right2y = ey - py;
      const rungCount = Math.max(4, Math.min(12, Math.floor(len / 30)));
      const rungs: JSX.Element[] = [];
      for (let i = 1; i < rungCount; i++) {
        const t = i / rungCount;
        const rx = sx + dx * t;
        const ry = sy + dy * t;
        const rungLeftX = rx + px;
        const rungLeftY = ry + py;
        const rungRightX = rx - px;
        const rungRightY = ry - py;
        rungs.push(<line key={`r-${l.from}-${i}`} x1={rungLeftX} y1={rungLeftY} x2={rungRightX} y2={rungRightY} stroke="#7a4e2b" strokeWidth={6} strokeLinecap="round" />);
      }
      return (
        <g key={`ladder-${l.from}`}>
          <line x1={left1x} y1={left1y} x2={left2x} y2={left2y} stroke="#8b5a2b" strokeWidth={12} strokeLinecap="round" />
          <line x1={right1x} y1={right1y} x2={right2x} y2={right2y} stroke="#8b5a2b" strokeWidth={12} strokeLinecap="round" />
          {rungs}
        </g>
      );
    });

    // svg on layer z=2 (above grid cells but tokens are separate layer z=3)
    return (
      <svg width={boardWidth} height={boardHeight} viewBox={`0 0 ${boardWidth} ${boardHeight}`} style={{ display: "block" }}>
        <g opacity={0.98}>
          {ladderGroups}
          {snakeGroups}
        </g>
      </svg>
    );
  };

  /* ============== Board cells rendering ============== */
  const renderBoardCells = () => {
    const cells: JSX.Element[] = [];
    for (let row = BOARD_SIZE; row >= 1; row--) {
      for (let col = 1; col <= BOARD_SIZE; col++) {
        const num = row % 2 === 0 ? row * 10 - col + 1 : row * 10 - 10 + col;
        cells.push(
          <div key={num}
            className={`relative flex items-start justify-start p-1 border text-xs font-bold ${num % 2 === 0 ? "bg-yellow-50" : "bg-yellow-100"}`}
            style={{ width: CELL_PX, height: CELL_PX }}>
            <div className="absolute top-1 left-1 text-[10px] text-gray-600">{num}</div>
          </div>
        );
      }
    }
    return cells;
  };

  /* ============== Tokens layer (absolute, above SVG) ============== */
  const renderTokensLayer = () => {
    // tokens positioned absolutely above board; always visible
    return (
      <div style={{ position: "absolute", left: 0, top: 0, width: boardWidth, height: boardHeight, zIndex: 3, pointerEvents: "none" }}>
        {playerOrder.map((p, idx) => {
          const pos = positions[idx];
          if (!pos || pos <= 0) return null;
          const { row, col } = cellToCoords(pos);
          // center coords
          const cx = col * CELL_PX + CELL_PX / 2;
          const cy = row * CELL_PX + CELL_PX / 2;
          // small offset to separate multiple tokens in same cell
          const offset = ((idx % 4) - 1.5) * (TOKEN_SIZE / 2);
          const left = cx - TOKEN_SIZE / 2 + offset;
          const top = cy - TOKEN_SIZE / 2;
          return (
            <div
              key={`token-${idx}`}
              style={{
                position: "absolute",
                left,
                top,
                width: TOKEN_SIZE,
                height: TOKEN_SIZE,
                borderRadius: TOKEN_SIZE / 2,
                background: COLOR_MAP[p.color] || "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 800,
                boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                transformOrigin: "center",
                pointerEvents: "none",
              }}
              className={`${animating.type === "ladder" && animating.playerIdx === idx ? "animate-climb" : ""} ${animating.type === "snake" && animating.playerIdx === idx ? "animate-fall" : ""}`}
            >
              {p.isCPU ? p.name[0].toUpperCase() : "Y"}
              {cryingPlayers[idx] && <span style={{ position: "absolute", top: -18, fontSize: 12 }}>😭</span>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8" style={{ background: "linear-gradient(180deg,#fff7c0,#c7f0b8)" }}>
      <style>{`
        .animate-climb { animation: climb 900ms ease forwards; }
        @keyframes climb { 0%{transform:translateY(0) scale(1)}50%{transform:translateY(-22px) scale(1.15) rotate(-4deg)}100%{transform:translateY(0) scale(1)} }
        .animate-fall { animation: fall 900ms ease forwards; }
        @keyframes fall { 0%{transform:translateY(0) scale(1)}40%{transform:translateY(28px) scale(0.92) rotate(6deg); opacity:0.95}100%{transform:translateY(0) scale(1)} }
        .animate-cry { animation: pop 1400ms ease infinite; }
        @keyframes pop { 0%{transform:translateY(0)}50%{transform:translateY(-6px)}100%{transform:translateY(0)} }
        
        /* Custom scrollbar styling */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #888 #f1f1f1;
        }
      `}</style>

      <div className="w-full max-w-5xl bg-white/70 backdrop-blur rounded-xl p-4 md:p-6 shadow-lg">
        {/* Header - ONLY COLOR CHANGED TO BLACK */}
        <div className="flex items-center justify-center mb-4 md:mb-6">
          <div className="text-2xl md:text-4xl font-extrabold flex items-center gap-2 md:gap-3" style={{ color: "black" }}>
            <div className="relative">
              <span className="text-2xl md:text-4xl">S</span>
              <span className="absolute -right-3 -top-3 md:-right-4 md:-top-4 animate-[wiggle_1.8s_ease-in-out_infinite]">
                <svg width="48" height="48" className="md:w-16 md:h-16" viewBox="0 0 64 64" fill="none"><path d="M6 46c10-10 22 2 32-3 12-5 14-22 36-25" stroke="#0f9a5a" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/><ellipse cx="54" cy="23" rx="4" ry="3" fill="#000"/></svg>
              </span>
            </div>
            <div>NAKE &</div>
            <div className="relative">
              <span className="text-2xl md:text-4xl">L</span>
              <span className="absolute -left-3 -top-3 md:-left-4 md:-top-4 animate-[bob_2s_ease-in-out_infinite]">
                <svg width="48" height="48" className="md:w-16 md:h-16" viewBox="0 0 64 64" fill="none"><rect x="12" y="6" width="7" height="52" fill="#8b5a2b"/><rect x="45" y="6" width="7" height="52" fill="#8b5a2b"/><rect x="17" y="12" width="30" height="5" fill="#cbb092"/><rect x="17" y="28" width="30" height="5" fill="#cbb092"/><rect x="17" y="44" width="30" height="5" fill="#cbb092"/></svg>
              </span>
            </div>
            <div>ADDER</div>
          </div>
        </div>

        {/* Setup */}
        {setupOpen && (
          <div className="mb-4 bg-white p-4 rounded shadow flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex-1">
              <label className="block font-semibold" style={{ color: "black" }}>CPU Players</label>
              <input type="range" min={0} max={6} value={cpuCount} onChange={(e) => setCpuCount(Number(e.target.value))} className="w-full" />
              <div className="text-sm text-gray-600 mt-1">Selected CPUs: <span className="font-bold" style={{ color: "black" }}>{cpuCount}</span></div>
            </div>

            <div className="flex-1">
              <label className="block font-semibold" style={{ color: "black" }}>Your color</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {COLOR_POOL.map((c) => (
                  <button key={c} onClick={() => setHumanColor(c)} style={{ background: COLOR_MAP[c] }} className={`w-8 h-6 md:w-10 md:h-8 rounded ${humanColor === c ? "ring-2 ring-offset-1 ring-amber-300" : ""}`} />
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-2 md:mt-0 md:ml-auto">
              <button className="px-4 py-2 rounded" style={{ background: "linear-gradient(90deg,#ff7a18 0%,#ffb199 50%,#ffd27f 100%)", color: "white", fontWeight: 1000 }} onClick={startGameFromSetup}>Start</button>
              <button className="px-4 py-2 bg-white border rounded" style={{ color: "black" }} onClick={() => { setCpuCount(2); setHumanColor("Red"); }}>Reset</button>
            </div>
          </div>
        )}

        {/* Main Game Area with Scrolling Features */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Board Container with Scroll - REF ADDED */}
          <div 
            ref={boardContainerRef}
            className="relative bg-yellow-50 rounded-lg p-2 md:p-3 mx-auto lg:mx-0 custom-scrollbar" 
            style={{ 
              width: boardWidth, 
              height: boardHeight,
              maxWidth: "100%",
              maxHeight: "70vh",
              overflow: "auto"
            }}
          >
            {/* grid (zIndex 1) */}
            <div style={{
              position: "absolute",
              left: 0,
              top: 0,
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_PX}px)`,
              gridTemplateRows: `repeat(${BOARD_SIZE}, ${CELL_PX}px)`,
              width: boardWidth,
              height: boardHeight,
            }}>
              {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
                const numRow = BOARD_SIZE - Math.floor(i / BOARD_SIZE);
                const c = (i % BOARD_SIZE) + 1;
                const num = numRow % 2 === 0 ? numRow * 10 - c + 1 : numRow * 10 - 10 + c;
                return (
                  <div key={i} className={`relative flex items-start justify-start p-1 border text-xs font-bold ${num % 2 === 0 ? "bg-yellow-50" : "bg-yellow-100"}`} style={{ width: CELL_PX, height: CELL_PX }}>
                    <div className="absolute top-1 left-1 text-[10px] text-gray-600">{num}</div>
                  </div>
                );
              })}
            </div>

            {/* SVG overlay for snakes & ladders (zIndex 2) */}
            <div style={{ position: "absolute", left: 0, top: 0, zIndex: 2, pointerEvents: "none" }}>
              {renderConnectionsSVG()}
            </div>

            {/* Tokens layer (zIndex 3) always above SVG */}
            {renderTokensLayer()}
            
            {/* Scroll Hint (mobile only) */}
            <div className="lg:hidden absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
              ↕️ Scroll
            </div>
          </div>

          {/* Right Panel with Players List Scroll - REF ADDED */}
          <div className="w-full lg:w-80 bg-white p-4 rounded shadow flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="font-bold" style={{ color: "black" }}>Players</div>
              <div className="text-sm text-gray-500">{playerOrder.length ? `${turnIndex + 1}/${playerOrder.length}` : "—"}</div>
            </div>

            {/* Players List with Scroll - REF ADDED */}
            <div 
              ref={playersListRef}
              className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto custom-scrollbar pr-2"
              style={{ scrollBehavior: "smooth" }}
            >
              {playerOrder.length ? playerOrder.map((p, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-3 p-2 rounded ${idx === turnIndex ? "bg-blue-50 border-2 border-blue-200" : ""} transition-all duration-300`}
                  id={`player-${idx}`}
                >
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 16, 
                    background: COLOR_MAP[p.color], 
                    color: "white", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontWeight: 800,
                    border: idx === turnIndex ? "2px solid white" : "none",
                    boxShadow: idx === turnIndex ? "0 0 8px rgba(59, 130, 246, 0.5)" : "none"
                  }}>
                    {p.isCPU ? p.name[0].toUpperCase() : "Y"}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold" style={{ color: "black" }}>{p.name}{p.isCPU ? " (CPU)" : " (You)"}</div>
                    <div className="text-sm text-gray-500">Cell {positions[idx] || "Start"}</div>
                  </div>
                  {idx === turnIndex && (
                    <div className="animate-pulse text-blue-500 text-sm font-bold">🎯</div>
                  )}
                </div>
              )) : (
                <div className="text-gray-500 text-sm">No players yet</div>
              )}
            </div>

            {/* Game Controls */}
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-extrabold">🎲</div>
                <div className="text-2xl font-bold" style={{ color: "black" }}>{diceFace ?? "-"}</div>
                <div className="text-sm text-gray-500 ml-auto">{message}</div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button 
                onClick={onHumanRoll} 
                disabled={setupOpen || won || (playerOrder[turnIndex] && playerOrder[turnIndex].isCPU)} 
                className="flex-1 px-3 py-2 rounded text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed" 
                style={{ background: "linear-gradient(90deg,#ff7a18 0%,#ffb199 50%,#ffd27f 100%)" }}
              >
                Roll Dice
              </button>
              <button 
                onClick={resetAll} 
                className="px-3 py-2 bg-white border rounded" 
                style={{ color: "black" }}
              >
                Reset
              </button>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              Tip: Players must roll a 6 to enter from Start. Exact roll required for 100. Rolling a 6 grants an extra turn.
            </div>

            {/* Quick Scroll Buttons (mobile only) */}
            <div className="lg:hidden flex gap-2 mt-2">
              <button 
                onClick={() => {
                  if (boardContainerRef.current) {
                    boardContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded"
              >
                ⬆️ Top
              </button>
              <button 
                onClick={() => {
                  if (boardContainerRef.current) {
                    boardContainerRef.current.scrollTo({ top: boardContainerRef.current.scrollHeight, behavior: 'smooth' });
                  }
                }}
                className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded"
              >
                ⬇️ Bottom
              </button>
              <button 
                onClick={scrollToCurrentPlayer}
                className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
              >
                👤 Current
              </button>
            </div>

            {floatingCPU.visible && (
              <div style={{ position: "absolute", right: 8, top: `${floatingCPU.top}%`, zIndex: 40 }} className="flex items-center gap-2 p-2 bg-white rounded shadow">
                <div style={{ width: 32, height: 32, borderRadius: 16, background: "#334155", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                  {floatingCPU.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm" style={{ color: "black" }}>Hi! I'm {floatingCPU.name}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}