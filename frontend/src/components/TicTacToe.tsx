import React, { useState, useEffect, useCallback } from "react";

type Player = "X" | "O" | null;
type Difficulty = "Easy" | "Impossible";

const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const TicTacToe = () => {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<Player | "Draw" | null>(null);
  const [score, setScore] = useState({ X: 0, O: 0, Draw: 0 });
  const [difficulty, setDifficulty] = useState<Difficulty>("Impossible");
  const [showRules, setShowRules] = useState(false);
  const [statusAnim, setStatusAnim] = useState<"win" | "lose" | "draw" | null>(null);

  const checkWinner = useCallback((b: Player[]) => {
    for (const [a, bIdx, c] of winningCombinations) {
      if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) return b[a];
    }
    if (b.every(cell => cell !== null)) return "Draw";
    return null;
  }, []);

  const handleCellClick = (index: number) => {
    if (!isPlayerTurn || board[index] || winner) return;
    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    setIsPlayerTurn(false);
  };

  const minimax = useCallback((board: Player[], player: Player, depth = 0): number => {
    const result = checkWinner(board);
    if (result === "O") return 10 - depth;
    if (result === "X") return depth - 10;
    if (result === "Draw") return 0;

    const emptyCells = board.map((cell, i) => (cell === null ? i : null)).filter((i): i is number => i !== null);

    if (player === "O") {
      let best = -Infinity;
      for (const i of emptyCells) {
        board[i] = "O";
        best = Math.max(best, minimax(board, "X", depth + 1));
        board[i] = null;
      }
      return best;
    } else {
      let best = Infinity;
      for (const i of emptyCells) {
        board[i] = "X";
        best = Math.min(best, minimax(board, "O", depth + 1));
        board[i] = null;
      }
      return best;
    }
  }, [checkWinner]);

  const aiMove = useCallback(() => {
    const emptyIndices = board.map((_, i) => (board[i] === null ? i : null)).filter((i): i is number => i !== null);
    if (emptyIndices.length === 0 || winner) return;

    let choice: number;
    if (difficulty === "Easy") {
      choice = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    } else {
      let bestScore = -Infinity;
      let bestMove = emptyIndices[0];
      for (const i of emptyIndices) {
        const tempBoard = [...board];
        tempBoard[i] = "O";
        const score = minimax(tempBoard, "X");
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
      choice = bestMove;
    }

    setTimeout(() => {
      const newBoard = [...board];
      newBoard[choice] = "O";
      setBoard(newBoard);
      setIsPlayerTurn(true);
    }, 500);
  }, [board, difficulty, winner, minimax]);

  useEffect(() => {
    const result = checkWinner(board);
    if (result) {
      setWinner(result);
      if (result === "X") {
        setScore(p => ({ ...p, X: p.X + 1 }));
        setStatusAnim("win");
      } else if (result === "O") {
        setScore(p => ({ ...p, O: p.O + 1 }));
        setStatusAnim("lose");
      } else {
        setScore(p => ({ ...p, Draw: p.Draw + 1 }));
        setStatusAnim("draw");
      }
    } else if (!isPlayerTurn && !winner) {
      aiMove();
    }
  }, [board, isPlayerTurn, checkWinner, aiMove, winner]);

  const resetMatch = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setIsPlayerTurn(true);
    setStatusAnim(null);
  };

  return (
    <div style={styles.page}>
      <style>{globalStyles}</style>
      
      <div style={styles.container}>
        <h1 className="rainbow-text" style={styles.title}>TIC-TAC-TOE</h1>

        <div style={styles.layoutRow}>
          <div style={styles.grid}>
            {board.map((cell, i) => (
              <button
                key={i}
                className="game-button cell-glow"
                style={{ ...styles.cell, color: cell === "X" ? "#79c0ff" : "#ff7b72" }}
                onClick={() => handleCellClick(i)}
                disabled={!!cell || !!winner}
              >
                {cell}
              </button>
            ))}
          </div>

          <div style={styles.sidePanel}>
            <p style={styles.label}>SCOREBOARD</p>
            <div style={styles.scoreRow}>
              <div style={{...styles.scoreBox, borderColor: '#7ee787'}} className="score-glow">
                <span style={styles.scoreType}>PLAYER</span>
                <span style={styles.scoreVal}>{score.X}</span>
              </div>
              <div style={{...styles.scoreBox, borderColor: '#ffa657'}} className="score-glow">
                <span style={styles.scoreType}>DRAW</span>
                <span style={styles.scoreVal}>{score.Draw}</span>
              </div>
              <div style={{...styles.scoreBox, borderColor: '#a371f7'}} className="score-glow">
                <span style={styles.scoreType}>ENGINE</span>
                <span style={styles.scoreVal}>{score.O}</span>
              </div>
            </div>

            <p style={styles.label}>GAME CONFIGURATION</p>
            <div style={styles.buttonGrid}>
              <button className={`game-button ${difficulty === 'Easy' ? 'active-glow-green' : ''}`} 
                      style={{...styles.actionBtn, background: '#66bb6a'}} 
                      onClick={() => setDifficulty('Easy')}>
                EASY MODE
              </button>
              <button className={`game-button ${difficulty === 'Impossible' ? 'active-glow-purple' : ''}`} 
                      style={{...styles.actionBtn, background: '#ab47bc'}} 
                      onClick={() => setDifficulty('Impossible')}>
                PRO AI
              </button>
              <button className="game-button" 
                      style={{...styles.actionBtn, background: '#ee675c', gridColumn: 'span 2'}} 
                      onClick={resetMatch}>
                NEW MATCH
              </button>
              <button className="game-button" 
                      style={{...styles.actionBtn, background: '#4db6ac', gridColumn: 'span 2'}} 
                      onClick={() => setShowRules(true)}>
                 RULE BOOK
              </button>
            </div>
          </div>
        </div>
      </div>

      {statusAnim && (
        <div style={styles.overlay} onClick={() => setStatusAnim(null)}>
          <div style={styles.resultCard} className="modal-glow">
             <h2 style={{color: statusAnim === 'win' ? '#7ee787' : '#ff7b72', fontSize: '3rem', margin: 0}}>
               {statusAnim === 'win' ? '🏆 VICTORY' : statusAnim === 'lose' ? '💀 DEFEAT' : '🤝 DRAW'}
             </h2>
             <p style={{color: '#8b949e', marginTop: '10px'}}>CLICK ANYWHERE TO CONTINUE</p>
          </div>
        </div>
      )}

      {showRules && (
        <div style={styles.overlay} onClick={() => setShowRules(false)}>
          <div style={styles.modal} className="modal-glow" onClick={e => e.stopPropagation()}>
            <h2 style={styles.ruleTitle}>TECHNICAL SPECIFICATIONS</h2>
            <div style={styles.ruleContent}>
              <section style={{marginBottom: '15px'}}>
                <h4 style={{color: '#79c0ff', margin: '0 0 5px 0'}}>I. OBJECTIVE</h4>
                <p style={{margin: 0}}>Players must achieve a linear sequence of three identical markers (X or O) across a 3x3 matrix.</p>
              </section>
              <section style={{marginBottom: '15px'}}>
                <h4 style={{color: '#7ee787', margin: '0 0 5px 0'}}>II. TURN PROTOCOL</h4>
                <p style={{margin: 0}}>The human participant initiates gameplay as 'X'. The AI Engine responds as 'O' following each move.</p>
              </section>
              <section>
                <h4 style={{color: '#ab47bc', margin: '0 0 5px 0'}}>III. LOGIC ENGINE</h4>
                <p style={{margin: 0}}>'Pro AI' utilizes a recursive Minimax algorithm, ensuring a mathematically perfect response to any strategy.</p>
              </section>
            </div>
            <button className="game-button" style={styles.closeBtn} onClick={() => setShowRules(false)}>GOT IT</button>
          </div>
        </div>
      )}
    </div>
  );
};

const globalStyles = `
  @keyframes rainbow-flow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .rainbow-text {
    background: linear-gradient(90deg, #ff7b72, #ffa657, #7ee787, #79c0ff, #a371f7, #ff7b72);
    background-size: 300% 300%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: rainbow-flow 4s ease infinite;
  }
  .game-button { transition: 0.3s ease; cursor: pointer; border: none; }
  .game-button:hover { filter: brightness(1.2); transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
  
  .active-glow-green { box-shadow: 0 0 20px #66bb6a !important; border: 2px solid white !important; }
  .active-glow-purple { box-shadow: 0 0 20px #ab47bc !important; border: 2px solid white !important; }
  
  .score-glow:hover { box-shadow: 0 0 15px currentColor; }
  .modal-glow { box-shadow: 0 0 40px rgba(0,0,0,0.6); }
`;

const styles: Record<string, React.CSSProperties> = {
  page: { height: '100vh', width: '100vw', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif' },
  container: { width: '850px', padding: '50px', background: '#161b22', borderRadius: '40px', border: '1px solid #30363d' },
  title: { fontSize: '4.5rem', fontWeight: 900, textAlign: 'center', marginBottom: '50px' },
  layoutRow: { display: 'flex', gap: '60px', alignItems: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 120px)', gap: '15px' },
  cell: { height: '120px', width: '120px', background: '#21262d', borderRadius: '20px', fontSize: '4rem', fontWeight: 800 },
  sidePanel: { flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' },
  label: { color: '#8b949e', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '2px' },
  scoreRow: { display: 'flex', gap: '12px' },
  scoreBox: { flex: 1, border: '2px solid', borderRadius: '15px', padding: '15px', textAlign: 'center', background: '#0d1117' },
  scoreType: { fontSize: '0.6rem', color: '#8b949e', fontWeight: 900 },
  scoreVal: { fontSize: '1.8rem', fontWeight: 900, color: 'white' },
  buttonGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  actionBtn: { padding: '15px', borderRadius: '12px', color: 'white', fontWeight: 900, fontSize: '0.85rem' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' },
  resultCard: { padding: '60px', background: '#21262d', borderRadius: '30px', textAlign: 'center', border: '1px solid #30363d' },
  modal: { background: '#161b22', padding: '40px', borderRadius: '30px', width: '450px', border: '1px solid #30363d' },
  ruleTitle: { color: 'white', borderBottom: '1px solid #30363d', paddingBottom: '15px', marginBottom: '20px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 800 },
  ruleContent: { color: '#c9d1d9', fontSize: '0.95rem', lineHeight: '1.6' },
  closeBtn: { marginTop: '30px', width: '100%', padding: '15px', background: '#79c0ff', borderRadius: '12px', color: '#0d1117', fontWeight: 900 }
};

export default TicTacToe;