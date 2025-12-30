import React, { useMemo, useState, useEffect } from "react";
import "./HandCricket.css";

type Anim = "win" | "lose" | "out" | null;
type HandNumber = 1 | 2 | 3 | 4 | 5 | 6;

const handImages: Record<HandNumber, string> = {
  1: "https://thumbs.dreamstime.com/b/image-features-stylized-d-hand-gesture-index-finger-raised-to-indicate-number-one-realistic-design-371438166.jpg",
  2: "https://img.freepik.com/premium-photo/gesture-hand-two-fingers-raised-up-hand-showing-victory-sign-v-sign-white-background_536380-144.jpg",
  3: "https://www.shutterstock.com/image-photo/hand-three-fingers-raised-thumb-260nw-2582859607.jpg",
  4: "https://www.shutterstock.com/image-illustration/3d-hand-gesture-symbol-four-260nw-2190009189.jpg",
  5: "https://www.shutterstock.com/image-photo/closeup-palm-five-fingers-spread-260nw-2511065569.jpg",
  6: "https://media.sketchfab.com/models/22ef97f2e973420dab6e4b0b73bd856c/thumbnails/82742b81cdd0478e8c5766c5baeeb9e7/ebbca283901a4d93aee71cf5b5bb4704.jpeg",
};

const HandCricket: React.FC = () => {

  // Add this useEffect to preserve theme when game loads
 useEffect(() => {
  const savedTheme = localStorage.getItem("game-theme");
  const isDark = savedTheme ? savedTheme === "dark" : true;
  
  if (isDark) {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }
}, []);

  // Game state
  const [gamePhase, setGamePhase] = useState<"toss_choice" | "toss_throw" | "toss_result" | "choose_side" | "playing" | "game_over">("toss_choice");
  const [tossChoice, setTossChoice] = useState<"odd" | "even" | null>(null);
  const [playerWinsToss, setPlayerWinsToss] = useState<boolean | null>(null);
  const [cpuTossChoice, setCpuTossChoice] = useState<"bat" | "bowl" | null>(null);
  
  // Match state
  const [isBatting, setIsBatting] = useState<boolean>(true);
  const [yourRuns, setYourRuns] = useState<number>(0);
  const [cpuRuns, setCpuRuns] = useState<number>(0);
  const [target, setTarget] = useState<number | null>(null);
  const [innings, setInnings] = useState<1 | 2>(1);
  
  // UI state
  const [message, setMessage] = useState("CHOOSE ODD OR EVEN FOR THE TOSS");
  const [lastMoves, setLastMoves] = useState({ player: 0, computer: 0 });
  const [statusAnim, setStatusAnim] = useState<Anim>(null);
  const [showRules, setShowRules] = useState(false);
  const [showHands, setShowHands] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [showResult, setShowResult] = useState(false);

  const matchTitle = useMemo(() => {
    if (statusAnim === "win") return "🏆 VICTORY";
    if (statusAnim === "lose") return "💀 DEFEAT";
    if (statusAnim === "out") return "☝️ OUT";
    return isBatting ? "BATTING" : "BOWLING";
  }, [statusAnim, isBatting]);

  const generateResultMessage = (result: "win" | "lose") => {
    const winMessages = [
      "YOU ABSOLUTELY NAILED IT! 🔥",
      "GOAT STATUS ACTIVATED! 🐐",
      "PURE DOMINATION! 💪",
      "THAT'S HOW CHAMPIONS PLAY! 🏆",
      "CPU GOT SMASHED! 😎"
    ];
    
    const loseMessages = [
      "CPU GOT THE W THIS TIME! 🤖",
      "SHAKE IT OFF, NEXT TIME! 🔄",
      "GOOD TRY, BETTER LUCK NEXT MATCH! 💪",
      "CPU PLAYED WELL, NO CAP! 🥲",
      "TIME FOR A REMATCH? 🔁"
    ];
    
    return result === "win" 
      ? winMessages[Math.floor(Math.random() * winMessages.length)]
      : loseMessages[Math.floor(Math.random() * loseMessages.length)];
  };

  const handleTossChoice = (choice: "odd" | "even") => {
    setTossChoice(choice);
    setMessage("SELECT A NUMBER (1-6) FOR THE TOSS");
    setGamePhase("toss_throw");
  };

  const playToss = (playerChoice: number) => {
    const computerChoice = Math.floor(Math.random() * 6) + 1;
    setLastMoves({ player: playerChoice, computer: computerChoice });
    setShowHands(true);
    setTimeout(() => setShowHands(false), 4000);

    const sum = playerChoice + computerChoice;
    const isOdd = sum % 2 === 1;
    const playerWins = (isOdd && tossChoice === "odd") || (!isOdd && tossChoice === "even");
    setPlayerWinsToss(playerWins);

    setTimeout(() => {
      if (playerWins) {
        setMessage("YOU WON THE TOSS! CHOOSE TO BAT OR BOWL");
        setGamePhase("choose_side");
      } else {
        setMessage("CPU WON THE TOSS");
        const cpuChoosesBat = Math.random() < 0.5;
        setCpuTossChoice(cpuChoosesBat ? "bat" : "bowl");
        setIsBatting(!cpuChoosesBat);
        
        setTimeout(() => {
          setMessage(cpuChoosesBat ? "CPU CHOSE TO BAT FIRST. YOU BOWL!" : "CPU CHOSE TO BOWL. YOU BAT!");
          setGamePhase("playing");
        }, 1500);
      }
    }, 1500);
  };

  const handleSideChoice = (choice: "bat" | "bowl") => {
    setIsBatting(choice === "bat");
    setMessage(choice === "bat" ? "YOU ARE BATTING FIRST!" : "YOU ARE BOWLING FIRST!");
    
    setTimeout(() => {
      setMessage(choice === "bat" ? "SELECT A NUMBER TO BAT" : "SELECT A NUMBER TO BOWL");
      setGamePhase("playing");
    }, 1500);
  };

  const checkGameOver = () => {
    if (innings === 1) return false;
    
    if (isBatting) {
      // Player batting second
      if (yourRuns > target!) {
        setResultMessage(generateResultMessage("win"));
        setStatusAnim("win");
        setShowResult(true);
        setGamePhase("game_over");
        return true;
      }
    } else {
      // CPU batting second
      if (cpuRuns > target!) {
        setResultMessage(generateResultMessage("lose"));
        setStatusAnim("lose");
        setShowResult(true);
        setGamePhase("game_over");
        return true;
      }
    }
    return false;
  };

  const playTurn = (playerChoice: number) => {
    if (gamePhase === "game_over" || statusAnim) return;

    const computerChoice = Math.floor(Math.random() * 6) + 1;
    setLastMoves({ player: playerChoice, computer: computerChoice });
    setShowHands(true);
    setTimeout(() => setShowHands(false), 4000);

    // OUT condition
    if (playerChoice === computerChoice) {
      if (isBatting) {
        // Player gets out while batting
        setStatusAnim("out");
        const newTarget = yourRuns + 1;
        setTarget(newTarget);
        
        setTimeout(() => {
          setMessage(`TARGET: ${newTarget}. NOW BOWL!`);
          setIsBatting(false);
          setInnings(2);
          setStatusAnim(null);
        }, 1500);
      } else {
        // CPU gets out while batting
        setStatusAnim("out");
        setTimeout(() => {
          if (innings === 2) {
            // Second innings - CPU chasing
            if (cpuRuns < target!) {
              setResultMessage(generateResultMessage("win"));
              setStatusAnim("win");
              setShowResult(true);
              setGamePhase("game_over");
            } else {
              setResultMessage(generateResultMessage("lose"));
              setStatusAnim("lose");
              setShowResult(true);
              setGamePhase("game_over");
            }
          } else {
            // First innings - CPU batting first and got out
            const newTarget = cpuRuns + 1;
            setTarget(newTarget);
            setMessage(`TARGET: ${newTarget}. NOW BAT!`);
            setIsBatting(true);
            setInnings(2);
            setStatusAnim(null);
          }
        }, 1500);
      }
      return;
    }

    // Scoring runs
    if (isBatting) {
      // Player batting
      const newRuns = yourRuns + playerChoice;
      setYourRuns(newRuns);
      setMessage(`SCORED ${playerChoice} RUNS!`);
      
      if (innings === 2 && newRuns > target!) {
        setTimeout(() => {
          setResultMessage(generateResultMessage("win"));
          setStatusAnim("win");
          setShowResult(true);
          setGamePhase("game_over");
        }, 500);
      }
    } else {
      // CPU batting
      const newRuns = cpuRuns + computerChoice;
      setCpuRuns(newRuns);
      setMessage(`CPU SCORED ${computerChoice} RUNS`);
      
      if (innings === 2 && newRuns > target!) {
        setTimeout(() => {
          setResultMessage(generateResultMessage("lose"));
          setStatusAnim("lose");
          setShowResult(true);
          setGamePhase("game_over");
        }, 500);
      }
    }
  };

  const resetMatch = () => {
    setGamePhase("toss_choice");
    setTossChoice(null);
    setPlayerWinsToss(null);
    setCpuTossChoice(null);
    setIsBatting(true);
    setYourRuns(0);
    setCpuRuns(0);
    setTarget(null);
    setMessage("CHOOSE ODD OR EVEN FOR THE TOSS");
    setInnings(1);
    setStatusAnim(null);
    setShowResult(false);
    setLastMoves({ player: 0, computer: 0 });
    setShowHands(false);
  };

  const dismissResult = () => {
    setShowResult(false);
    setStatusAnim(null);
  };

  return (
    <div className="hc-root dark-theme">
      {/* Animated Background */}
      <div className="bg-grid" />
      <div className="bg-gradient" />
      
      {/* Floating Elements */}
      <div className="floating-element bat-1">🏏</div>
      <div className="floating-element ball-1">⚾</div>
      <div className="floating-element bat-2">🏏</div>
      <div className="floating-element ball-2">⚾</div>
      <div className="floating-element bat-3">🏏</div>

      {/* Hands Display */}
      {showHands && lastMoves.player > 0 && (
        <div className="hands-container">
          <div className="hand-card player-hand">
            <div className="hand-label">YOU</div>
            <img
              className="hand-image"
              src={handImages[lastMoves.player as HandNumber]}
              alt={`Hand showing ${lastMoves.player}`}
            />
            <div className="hand-number">{lastMoves.player}</div>
          </div>
          <div className="hand-card cpu-hand">
            <div className="hand-label">CPU</div>
            <img
              className="hand-image"
              src={handImages[lastMoves.computer as HandNumber]}
              alt={`Hand showing ${lastMoves.computer}`}
            />
            <div className="hand-number">{lastMoves.computer}</div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="hc-container">
        <header className="hc-header">
          <div className="header-left">
            <div className="game-tag">HAND CRICKET • PRO</div>
            <h1 className="game-title">NUMBER SHOWDOWN</h1>
            <div className="game-subtitle">
              {gamePhase === "playing" 
                ? isBatting ? "🏏 Batting • Score Runs" : "🎯 Bowling • Take Wickets"
                : "🎲 Toss Phase • Choose Wisely"}
            </div>
          </div>
          
          <div className="header-actions">
            <button className="btn btn-outline" onClick={() => setShowRules(true)}>
              📖 Rules
            </button>
            <button className="btn btn-primary" onClick={resetMatch}>
              🔄 New Match
            </button>
          </div>
        </header>

        <main className="hc-main">
          {/* Main Game Card */}
          <div className="game-card">
            {gamePhase === "playing" && (
              <>
                <div className="game-header">
                  <div className={`status-badge ${isBatting ? "batting" : "bowling"}`}>
                    {matchTitle}
                  </div>
                  {target && (
                    <div className="target-display">
                      <span className="target-label">TARGET</span>
                      <span className="target-value">{target}</span>
                    </div>
                  )}
                </div>

                <div className="score-display">
                  <div className="score-card main-score">
                    <div className="score-label">{isBatting ? "YOUR SCORE" : "CPU CHASE"}</div>
                    <div className="score-value">{isBatting ? yourRuns : cpuRuns}</div>
                    <div className="score-innings">Innings {innings}</div>
                  </div>

                  <div className="moves-display">
                    <div className="move-card">
                      <div className="move-label">YOUR MOVE</div>
                      <div className="move-value">{lastMoves.player || "?"}</div>
                    </div>
                    <div className="move-card">
                      <div className="move-label">CPU MOVE</div>
                      <div className="move-value">{lastMoves.computer || "?"}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Message Display */}
            <div className="message-box">
              <div className="message-text">{message}</div>
            </div>

            {/* Input Pad */}
            <div className={`input-pad ${statusAnim ? "disabled" : ""}`}>
              {gamePhase === "toss_choice" ? (
                <>
                  <button className="choice-btn odd" onClick={() => handleTossChoice("odd")}>
                    <span className="choice-icon">🎲</span>
                    <span className="choice-text">ODD</span>
                  </button>
                  <button className="choice-btn even" onClick={() => handleTossChoice("even")}>
                    <span className="choice-icon">🎯</span>
                    <span className="choice-text">EVEN</span>
                  </button>
                </>
              ) : gamePhase === "choose_side" ? (
                <>
                  <button className="choice-btn bat" onClick={() => handleSideChoice("bat")}>
                    <span className="choice-icon">🏏</span>
                    <span className="choice-text">BAT FIRST</span>
                  </button>
                  <button className="choice-btn bowl" onClick={() => handleSideChoice("bowl")}>
                    <span className="choice-icon">🎯</span>
                    <span className="choice-text">BOWL FIRST</span>
                  </button>
                </>
              ) : (
                [1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    className="number-btn"
                    onClick={() => gamePhase === "toss_throw" ? playToss(num) : playTurn(num)}
                    disabled={statusAnim !== null || gamePhase === "game_over"}
                  >
                    <span className="number-text">{num}</span>
                  </button>
                ))
              )}
            </div>

            {/* Game Info */}
            {gamePhase === "playing" && (
              <div className="game-info">
                <div className="info-text">
                  {isBatting 
                    ? "🏏 Score runs! Same number = OUT!" 
                    : "🎯 Take wickets! Same number = OUT!"}
                </div>
                <div className={`turn-indicator ${isBatting ? "bat" : "bowl"}`}>
                  {isBatting ? "BATTING" : "BOWLING"}
                </div>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="side-panel">
            <div className="panel-title">MATCH STATS</div>
            
            <div className="stat-item">
              <div className="stat-label">YOUR INNINGS</div>
              <div className="stat-value">{yourRuns}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">CPU CHASE</div>
              <div className="stat-value">{cpuRuns}</div>
            </div>
            
            <div className="stat-item target">
              <div className="stat-label">TARGET</div>
              <div className="stat-value">{target || "—"}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">INNINGS</div>
              <div className="stat-value">{innings}/2</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">STATUS</div>
              <div className={`status-value ${isBatting ? "bat" : "bowl"}`}>
                {isBatting ? "Batting" : "Bowling"}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Result Overlay */}
      {showResult && (
        <div className="result-overlay" onClick={dismissResult}>
          <div className={`result-modal ${statusAnim}`}>
            <div className="result-icon">
              {statusAnim === "win" ? "🏆" : statusAnim === "lose" ? "💀" : "☝️"}
            </div>
            <div className="result-title">{resultMessage}</div>
            
            <div className="result-stats">
              <div className="result-stat">
                <div className="stat-name">YOUR SCORE</div>
                <div className="stat-value">{yourRuns}</div>
              </div>
              <div className="result-stat">
                <div className="stat-name">CPU SCORE</div>
                <div className="stat-value">{cpuRuns}</div>
              </div>
              <div className="result-stat">
                <div className="stat-name">TARGET</div>
                <div className="stat-value">{target || "—"}</div>
              </div>
            </div>
            
            <div className="result-actions">
              <button className="btn btn-primary" onClick={resetMatch}>
                PLAY AGAIN
              </button>
              <button className="btn btn-outline" onClick={dismissResult}>
                VIEW STATS
              </button>
            </div>
            
            <div className="result-footer">
              Tap anywhere or press ESC to close
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && (
        <div className="rules-overlay" onClick={() => setShowRules(false)}>
          <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rules-header">
              <div className="rules-title">GAME RULES</div>
              <button className="close-btn" onClick={() => setShowRules(false)}>✕</button>
            </div>
            
            <div className="rules-content">
              <div className="rule-section">
                <h3>🎲 TOSS PHASE</h3>
                <ul>
                  <li>Choose ODD or EVEN</li>
                  <li>Both players select numbers 1-6</li>
                  <li>Sum determines toss winner</li>
                  <li>Winner chooses to bat or bowl first</li>
                </ul>
              </div>
              
              <div className="rule-section">
                <h3>🏏 GAME FLOW</h3>
                <ul>
                  <li><strong>If you bat first:</strong> Score runs until out, then defend total</li>
                  <li><strong>If you bowl first:</strong> Get CPU out, then chase target</li>
                  <li>Target = Opponent's score + 1</li>
                  <li>Same numbers = OUT!</li>
                  <li>Different numbers = Batsman scores their number</li>
                </ul>
              </div>
              
              <div className="rule-section">
                <h3>🎯 WIN CONDITIONS</h3>
                <ul>
                  <li>Bat first: Prevent CPU from reaching target</li>
                  <li>Bowl first: Chase target before getting out</li>
                  <li>Two innings total</li>
                  <li>Higher score wins after both innings</li>
                </ul>
              </div>
            </div>
            
            <button className="btn btn-primary" onClick={() => setShowRules(false)}>
              GOT IT, LET'S PLAY!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HandCricket;