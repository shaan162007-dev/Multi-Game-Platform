import React, { useState, useEffect, useRef, useCallback } from 'react';
import "./Ludo.css";


// Types
type PlayerColor = 'red' | 'green' | 'blue' | 'yellow';
type PlayerStatus = 'waiting' | 'playing' | 'finished';
type GamePhase = 'setup' | 'playing' | 'finished';
type PawnState = 'home' | 'active' | 'safe' | 'home-stretch' | 'finished';

interface Player {
  id: number;
  color: PlayerColor;
  name: string;
  displayName: string;
  isCPU: boolean;
  pawns: Pawn[];
  status: PlayerStatus;
  finishedPawns: number;
  position: number;
  startCell: number;
  homeCells: number[];
  safeCells: number[];
}

interface Pawn {
  id: number;
  position: number;
  state: PawnState;
  playerId: number;
  steps: number;
}

interface GameState {
  phase: GamePhase;
  currentPlayer: number;
  diceValue: number;
  hasRolledSix: boolean;
  canMove: boolean;
  players: Player[];
  board: (number | null)[][];
  leaderboard: { playerId: number; position: number; color: PlayerColor; name: string }[];
  safePositions: number[];
  selectedPawn: number | null;
}

// Constants
const BOARD_SIZE = 15;
const PAWNS_PER_PLAYER = 4;
const CPU_NAMES = ['Aditi', 'Ankit', 'Souvik'];
const SAFE_CELLS = [1, 9, 14, 22, 27, 35, 40, 48];
const START_CELLS = { red: 0, green: 13, blue: 26, yellow: 39 };

// Color mappings for GenZ style
const COLORS = {
  red: { 
    primary: '#FF3B5C', 
    secondary: '#FF6B8B', 
    light: '#FFE5EB',
    gradient: 'linear-gradient(135deg, #FF3B5C 0%, #FF6B8B 100%)'
  },
  green: { 
    primary: '#00D4AA', 
    secondary: '#2AFFC4', 
    light: '#E6FFF8',
    gradient: 'linear-gradient(135deg, #00D4AA 0%, #2AFFC4 100%)'
  },
  blue: { 
    primary: '#3B82F6', 
    secondary: '#60A5FA', 
    light: '#EFF6FF',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)'
  },
  yellow: { 
    primary: '#F59E0B', 
    secondary: '#FBBF24', 
    light: '#FFFBEB',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
  }
};

const Ludo: React.FC = () => {
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    phase: 'setup',
    currentPlayer: 0,
    diceValue: 0,
    hasRolledSix: false,
    canMove: false,
    players: [],
    board: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null)),
    leaderboard: [],
    safePositions: SAFE_CELLS,
    selectedPawn: null
  });

  const [selectedCPU, setSelectedCPU] = useState<number>(1);
  const [selectedColor, setSelectedColor] = useState<PlayerColor>('red');
  const [playerName, setPlayerName] = useState<string>('Player');
  const [showRules, setShowRules] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [particleCount, setParticleCount] = useState(0);

  // Refs
  const diceRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  // Initialize board with proper paths
  const initializeBoard = useCallback(() => {
    const board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    
    // Define paths for each color
    const paths = {
      red: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51],
      green: [13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,0,1,2,3,4,5,6,7,8,9,10,11,12],
      blue: [26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],
      yellow: [39,40,41,42,43,44,45,46,47,48,49,50,51,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38]
    };

    // Map path indices to board coordinates
    const pathToCoords = (pathIndex: number): [number, number] => {
      // This is a simplified mapping - you'd expand this based on actual board layout
      const row = Math.floor(pathIndex / 15);
      const col = pathIndex % 15;
      return [row, col];
    };

    return board;
  }, []);

  // Initialize players
  const initializePlayers = useCallback(() => {
    const colors: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];
    const remainingColors = colors.filter(c => c !== selectedColor);
    
    const players: Player[] = [
      {
        id: 0,
        color: selectedColor,
        name: 'You',
        displayName: playerName || 'You',
        isCPU: false,
        pawns: Array(PAWNS_PER_PLAYER).fill(0).map((_, i) => ({
          id: i,
          position: -1,
          state: 'home',
          playerId: 0,
          steps: 0
        })),
        status: 'waiting',
        finishedPawns: 0,
        position: 0,
        startCell: START_CELLS[selectedColor],
        homeCells: [],
        safeCells: []
      }
    ];

    // Add CPU players
    for (let i = 0; i < selectedCPU; i++) {
      const color = remainingColors[i];
      players.push({
        id: i + 1,
        color: color,
        name: `CPU${i + 1}`,
        displayName: CPU_NAMES[i] || `CPU${i + 1}`,
        isCPU: true,
        pawns: Array(PAWNS_PER_PLAYER).fill(0).map((_, j) => ({
          id: j,
          position: -1,
          state: 'home',
          playerId: i + 1,
          steps: 0
        })),
        status: 'waiting',
        finishedPawns: 0,
        position: i + 1,
        startCell: START_CELLS[color],
        homeCells: [],
        safeCells: []
      });
    }

    // Initialize board
    const board = initializeBoard();
    
    setGameState(prev => ({
      ...prev,
      players,
      board,
      currentPlayer: 0,
      phase: 'playing'
    }));
  }, [selectedColor, selectedCPU, playerName, initializeBoard]);

  // Roll dice function
  const rollDice = () => {
    if (isRolling || gameState.phase !== 'playing') return;
    
    setIsRolling(true);
    const newNumber = Math.floor(Math.random() * 6) + 1;
    
    // Animate dice
    if (diceRef.current) {
      diceRef.current.style.animation = 'roll 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    }

    setTimeout(() => {
      setIsRolling(false);
      
      setGameState(prev => {
        const currentPlayer = prev.players[prev.currentPlayer];
        const hasPawnsOut = currentPlayer.pawns.some(p => p.state !== 'home' && p.state !== 'finished');
        
        // Check if player can move
        const canMove = newNumber === 6 || hasPawnsOut;
        
        // Create particles for 6
        if (newNumber === 6 && particlesRef.current) {
          createParticle(true);
        }
        
        return {
          ...prev,
          diceValue: newNumber,
          canMove,
          hasRolledSix: newNumber === 6
        };
      });

      // Handle CPU turn
      const currentPlayer = gameState.players[gameState.currentPlayer];
      if (currentPlayer?.isCPU && gameState.phase === 'playing') {
        setTimeout(() => {
          handleCPUTurn(newNumber);
        }, 1500);
      }
    }, 1200);
  };

  // Check if pawn can move
  const canPawnMove = (pawn: Pawn, diceValue: number, playerId: number): boolean => {
    const player = gameState.players[playerId];
    if (!player) return false;
    
    // Need 6 to leave home
    if (pawn.state === 'home' && diceValue !== 6) return false;
    
    // Check if pawn can finish
    if (pawn.state === 'home-stretch') {
      const remaining = 5 - pawn.steps % 6;
      return diceValue <= remaining;
    }
    
    // Check bounds for board pawns
    if (pawn.state === 'active' || pawn.state === 'safe') {
      const newPosition = (pawn.position + diceValue) % 52;
      return true; // Simplified - add more logic for collisions
    }
    
    return true;
  };

  // Move pawn function
  const movePawn = (playerId: number, pawnId: number, diceValue: number) => {
    setGameState(prev => {
      const newPlayers = [...prev.players];
      const player = newPlayers[playerId];
      const pawn = player.pawns[pawnId];
      const newBoard = [...prev.board.map(row => [...row])];
      
      // Remove from old position
      if (pawn.position !== -1 && pawn.state !== 'finished') {
        const [row, col] = positionToCoords(pawn.position);
        newBoard[row][col] = null;
      }
      
      // Handle move based on state
      if (pawn.state === 'home' && diceValue === 6) {
        // Move out of home
        pawn.position = player.startCell;
        pawn.state = 'active';
        pawn.steps = 1;
        
        // Place on board
        const [row, col] = positionToCoords(pawn.position);
        newBoard[row][col] = playerId;
      } else if (pawn.state === 'active' || pawn.state === 'safe') {
        const newPosition = (pawn.position + diceValue) % 52;
        
        // Check for capture
        const [newRow, newCol] = positionToCoords(newPosition);
        const existingPawn = newBoard[newRow][newCol];
        
        if (existingPawn !== null && existingPawn !== playerId) {
          // Check if it's a safe cell
          if (!SAFE_CELLS.includes(newPosition)) {
            // Capture opponent pawn
            const capturedPlayer = newPlayers[existingPawn];
            const capturedPawn = capturedPlayer.pawns.find(p => 
              p.position === newPosition && p.state !== 'finished'
            );
            
            if (capturedPawn) {
              capturedPawn.position = -1;
              capturedPawn.state = 'home';
              capturedPawn.steps = 0;
            }
          }
        }
        
        // Update pawn position
        pawn.position = newPosition;
        pawn.steps += diceValue;
        
        // Check if entering home stretch
        if (pawn.steps >= 52) {
          pawn.state = 'home-stretch';
        } else {
          pawn.state = SAFE_CELLS.includes(newPosition) ? 'safe' : 'active';
        }
        
        // Place on board
        newBoard[newRow][newCol] = playerId;
      } else if (pawn.state === 'home-stretch') {
        // Move in home stretch
        pawn.steps += diceValue;
        
        // Check if finished
        if (pawn.steps >= 57) { // 52 + 5 steps in home
          pawn.state = 'finished';
          pawn.position = 200 + player.finishedPawns;
          player.finishedPawns++;
          
          // Check if player won
          if (player.finishedPawns === PAWNS_PER_PLAYER) {
            player.status = 'finished';
            const position = prev.leaderboard.length + 1;
            prev.leaderboard.push({
              playerId: player.id,
              position,
              color: player.color,
              name: player.displayName
            });
            
            // Check if game should end
            if (player.id === 0 && position === 1) {
              return {
                ...prev,
                players: newPlayers,
                board: newBoard,
                phase: 'finished'
              };
            }
          }
        }
      }
      
      // Check for another turn (rolled 6)
      const hasAnotherTurn = diceValue === 6 && player.finishedPawns < PAWNS_PER_PLAYER;
      
      // Move to next player if no 6
      let nextPlayer = prev.currentPlayer;
      if (!hasAnotherTurn) {
        do {
          nextPlayer = (nextPlayer + 1) % newPlayers.length;
        } while (newPlayers[nextPlayer].status === 'finished');
      }
      
      return {
        ...prev,
        players: newPlayers,
        board: newBoard,
        currentPlayer: nextPlayer,
        hasRolledSix: hasAnotherTurn,
        canMove: false,
        diceValue: 0,
        selectedPawn: null
      };
    });
  };

  // Handle CPU turn
  const handleCPUTurn = (diceValue: number) => {
    const player = gameState.players[gameState.currentPlayer];
    if (!player) return;
    
    const movablePawns = player.pawns.filter(p => canPawnMove(p, diceValue, player.id));
    
    if (movablePawns.length > 0) {
      // Simple AI: prioritize pawns that can capture or enter home stretch
      const prioritizedPawns = movablePawns.sort((a, b) => {
        if (a.state === 'home-stretch') return -1;
        if (b.state === 'home-stretch') return 1;
        return 0;
      });
      
      const chosenPawn = prioritizedPawns[0];
      movePawn(player.id, chosenPawn.id, diceValue);
    } else {
      // No move possible, end turn
      setGameState(prev => {
        let nextPlayer = prev.currentPlayer;
        do {
          nextPlayer = (nextPlayer + 1) % prev.players.length;
        } while (prev.players[nextPlayer].status === 'finished');
        
        return {
          ...prev,
          currentPlayer: nextPlayer,
          canMove: false,
          diceValue: 0
        };
      });
    }
  };

  // Convert position to board coordinates
  const positionToCoords = (position: number): [number, number] => {
    if (position < 0) return [-1, -1]; // Home position
    
    // Simplified mapping - you'd create proper mapping for 15x15 board
    const row = Math.floor(position / 15);
    const col = position % 15;
    return [row, col];
  };

  // Create particle effect
  const createParticle = (explosion = false) => {
    if (!particlesRef.current) return;

    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const colors = ['#FF3B5C', '#00D4AA', '#3B82F6', '#F59E0B', '#8B5CF6'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    particle.style.cssText = `
      position: absolute;
      width: ${explosion ? '8px' : '4px'};
      height: ${explosion ? '8px' : '4px'};
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      z-index: 5;
      filter: blur(${explosion ? '2px' : '1px'});
      box-shadow: 0 0 ${explosion ? '15px' : '8px'} ${color};
      left: ${50 + Math.random() * 20}%;
      top: ${50 + Math.random() * 20}%;
      opacity: ${explosion ? '0.9' : '0.6'};
      animation: ${explosion ? 'explode 1.2s ease-out forwards' : 'floatParticle 4s linear infinite'};
    `;

    particlesRef.current.appendChild(particle);
    setParticleCount(prev => prev + 1);

    setTimeout(() => {
      if (particle.parentNode) {
        particle.remove();
        setParticleCount(prev => prev - 1);
      }
    }, explosion ? 1200 : 4000);
  };

  // Start game
  const startGame = () => {
    if (gameState.phase === 'setup') {
      initializePlayers();
    }
  };

  // Reset game
  const resetGame = () => {
    setGameState({
      phase: 'setup',
      currentPlayer: 0,
      diceValue: 0,
      hasRolledSix: false,
      canMove: false,
      players: [],
      board: Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null)),
      leaderboard: [],
      safePositions: SAFE_CELLS,
      selectedPawn: null
    });
    setSelectedCPU(1);
    };

  // Effects
  useEffect(() => {
    // Glow effect
    const glowInterval = setInterval(() => {
      setGlowIntensity(prev => (prev + 0.03) % (Math.PI * 2));
    }, 50);

    // Particle generator
    const particleInterval = setInterval(() => {
      if (particlesRef.current && !isRolling && gameState.phase === 'playing') {
        createParticle();
      }
    }, 800);

    // Auto-roll for CPU
    if (gameState.phase === 'playing' && 
        gameState.players[gameState.currentPlayer]?.isCPU && 
        !gameState.canMove && 
        !isRolling) {
      const timer = setTimeout(() => {
        rollDice();
      }, 2000);
      return () => clearTimeout(timer);
    }

    return () => {
      clearInterval(glowInterval);
      clearInterval(particleInterval);
    };
  }, [gameState, isRolling]);

  // Render board cell
  const renderBoardCell = (row: number, col: number) => {
    const playerId = gameState.board[row][col];
    const player = playerId !== null ? gameState.players[playerId] : null;
    const position = row * 15 + col;
    const isSafe = SAFE_CELLS.includes(position);
    const isStart = Object.values(START_CELLS).includes(position);
    
    // Determine cell color based on position
    let cellColor = '#1a1a2e';
    let borderColor = '#16213e';
    
    // Color quadrants
    if ((row >= 1 && row <= 3 && col >= 1 && col <= 3)) cellColor = '#2a0a45'; // Red home
    if ((row >= 1 && row <= 3 && col >= 11 && col <= 13)) cellColor = '#0a452a'; // Green home
    if ((row >= 11 && row <= 13 && col >= 11 && col <= 13)) cellColor = '#0a2a45'; // Blue home
    if ((row >= 11 && row <= 13 && col >= 1 && col <= 3)) cellColor = '#45450a'; // Yellow home
    
    // Main paths
    if (row === 7 || col === 7) cellColor = '#0f3460';
    
    return (
      <div
        key={`${row}-${col}`}
        className="board-cell"
        style={{
          backgroundColor: cellColor,
          border: `1px solid ${isSafe ? '#F59E0B' : borderColor}`,
          borderRadius: isSafe ? '8px' : '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
      >
        {isSafe && (
          <div style={{
            color: '#F59E0B',
            fontSize: '14px',
            fontWeight: 'bold',
            animation: 'starTwinkle 2s infinite'
          }}>
            ★
          </div>
        )}
        
        {isStart && (
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#ffffff50',
            position: 'absolute'
          }} />
        )}
        
        {player && (
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: COLORS[player.color].primary,
              border: `2px solid ${COLORS[player.color].secondary}`,
              boxShadow: `0 0 12px ${COLORS[player.color].primary}`,
              position: 'absolute',
              zIndex: 10,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => {
              if (!player.isCPU && 
                  gameState.currentPlayer === player.id && 
                  gameState.canMove) {
                const pawn = player.pawns.find(p => p.position === position);
                if (pawn && canPawnMove(pawn, gameState.diceValue, player.id)) {
                  movePawn(player.id, pawn.id, gameState.diceValue);
                }
              }
            }}
            onMouseEnter={(e) => {
              if (!player.isCPU && 
                  gameState.currentPlayer === player.id && 
                  gameState.canMove) {
                e.currentTarget.style.transform = 'scale(1.3)';
                e.currentTarget.style.boxShadow = `0 0 20px ${COLORS[player.color].primary}`;
              }
            }}
            onMouseLeave={(e) => {
              if (!player.isCPU) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        fontFamily: '"Orbitron", -apple-system, BlinkMacSystemFont, sans-serif',
        overflow: 'hidden',
        position: 'relative',
        padding: '20px'
      }}
    >
      {/* Animated Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(255, 59, 92, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(0, 212, 170, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(245, 158, 11, 0.15) 0%, transparent 50%)
        `,
        zIndex: 1
      }} />

      {/* Floating Particles Container */}
      <div ref={particlesRef} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2 }} />

      {/* Rules Button */}
      <button
        onClick={() => setShowRules(!showRules)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 100,
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          borderRadius: '30px',
          color: 'white',
          fontFamily: '"Orbitron", sans-serif',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
          fontSize: '1rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backdropFilter: 'blur(10px)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.4)';
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>📘</span>
        GAME GUIDE
      </button>

      {/* Main Game Container */}
      <div style={{
        textAlign: 'center',
        color: 'white',
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        borderRadius: '28px',
        background: 'rgba(16, 14, 29, 0.85)',
        backdropFilter: 'blur(20px)',
        boxShadow: `
          0 25px 50px rgba(0, 0, 0, 0.5),
          0 0 100px rgba(59, 130, 246, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `,
        border: '1px solid rgba(255, 255, 255, 0.15)',
        position: 'relative',
        zIndex: 10,
        width: 'min(1000px, 95vw)',
        margin: '0 auto',
        maxHeight: '95vh',
        overflowY: 'auto'
      }}>
        {/* Glowing Border */}
        <div style={{
          position: 'absolute',
          inset: '-3px',
          borderRadius: '31px',
          background: `linear-gradient(45deg, 
            rgba(255, 59, 92, ${0.3 + Math.sin(glowIntensity) * 0.2}), 
            rgba(0, 212, 170, ${0.3 + Math.cos(glowIntensity) * 0.2}), 
            rgba(59, 130, 246, ${0.3 + Math.sin(glowIntensity * 1.5) * 0.2})
          )`,
          zIndex: -1,
          filter: 'blur(20px)',
          animation: 'borderPulse 4s ease-in-out infinite'
        }} />

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: 'clamp(3rem, 10vw, 4.5rem)',
            margin: '0 0 0.5rem 0',
            background: 'linear-gradient(45deg, #c7ff1dff, #01eeffff, #3B82F6, #F59E0B)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 40px rgba(36, 19, 221, 0.5)',
            letterSpacing: '3px',
            fontWeight: 900,
            textTransform: 'uppercase',
            lineHeight: 1.1
          }}>
            LUDO PRO
          </h1>
          
          <p style={{
            fontSize: 'clamp(1rem, 3vw, 1.4rem)',
            opacity: 0.9,
            marginBottom: '1.5rem',
            background: 'linear-gradient(45deg, #ffffff, #d1d5db)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 600,
            padding: '0 1rem'
          }}><i>ULTIMATE EDITION • GENZ MODE</i></p>
          <h3 style={{ color: '#ff0808ff' }}><b><u>UNDER CONSTRUCTION • NOT PLAYABLE</u></b></h3>
        </div>

        {/* Game Content */}
        {gameState.phase === 'setup' && (
          <div style={{
            animation: 'fadeInUp 0.6s ease-out',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <h2 style={{
              background: 'linear-gradient(45deg, #FF3B5C, #00D4AA)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '2rem',
              fontSize: '2rem'
            }}>
              🎮 CREATE YOUR GAME
            </h2>

            {/* Player Name */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#94a3b8', marginBottom: '1rem' }}>YOUR NAME</h3>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={{
                  padding: '15px 25px',
                  fontSize: '1.2rem',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '15px',
                  color: 'white',
                  width: '100%',
                  textAlign: 'center',
                  fontFamily: '"Orbitron", sans-serif',
                  transition: 'all 0.3s ease'
                }}
                placeholder="Enter your cool name"
              />
            </div>

            {/* Color Selection */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#94a3b8', marginBottom: '1rem' }}>CHOOSE YOUR COLOR</h3>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {(['red', 'green', 'blue', 'yellow'] as PlayerColor[]).map(color => (
                  <div
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '20px',
                      background: COLORS[color].gradient,
                      border: selectedColor === color ? '4px solid white' : '2px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      boxShadow: selectedColor === color 
                        ? `0 0 30px ${COLORS[color].primary}` 
                        : '0 8px 20px rgba(0,0,0,0.3)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedColor !== color) {
                        e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
                        e.currentTarget.style.boxShadow = `0 0 25px ${COLORS[color].primary}`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedColor !== color) {
                        e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                      }
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
                      animation: 'shine 2s infinite linear'
                    }} />
                  </div>
                ))}
              </div>
            </div>

            {/* CPU Selection */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ color: '#94a3b8', marginBottom: '1rem' }}>OPPONENTS</h3>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {[1, 2, 3].map(num => (
                  <button
                    key={num}
                    onClick={() => setSelectedCPU(num)}
                    style={{
                      padding: '1rem 2rem',
                      background: selectedCPU === num 
                        ? 'linear-gradient(45deg, #8B5CF6, #3B82F6)' 
                        : 'rgba(30, 41, 59, 0.7)',
                      border: selectedCPU === num ? '2px solid rgba(255,255,255,0.3)' : '2px solid rgba(255,255,255,0.1)',
                      borderRadius: '15px',
                      color: 'white',
                      fontFamily: '"Orbitron", sans-serif',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '1.1rem',
                      minWidth: '140px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCPU !== num) {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCPU !== num) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)';
                      }
                    }}
                  >
                    {num} CPU
                  </button>
                ))}
              </div>
              <div style={{ 
                marginTop: '1rem', 
                color: '#94a3b8',
                fontSize: '0.9rem'
              }}>
                🤖 Playing against: {CPU_NAMES.slice(0, selectedCPU).map((name, i) => 
                  `CPU${i + 1} - ${name}`).join(', ')}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startGame}
              style={{
                padding: '1.2rem 3rem',
                fontSize: '1.4rem',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #FF3B5C, #8B5CF6)',
                border: 'none',
                borderRadius: '25px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 15px 35px rgba(255, 59, 92, 0.4)',
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                maxWidth: '300px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 25px 45px rgba(255, 59, 92, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(255, 59, 92, 0.4)';
              }}
            >
              <span style={{ position: 'relative', zIndex: 2 }}>
                🚀 LAUNCH GAME
              </span>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                transition: 'left 0.7s'
              }} />
            </button>
          </div>
        )}

        {/* Game Playing */}
        {gameState.phase === 'playing' && (
          <>
            {/* Game Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '20px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>CURRENT TURN</div>
                <div style={{
                  color: gameState.players[gameState.currentPlayer]?.color ? 
                    COLORS[gameState.players[gameState.currentPlayer].color].primary : '#60a5fa',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  justifyContent: 'center'
                }}>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: gameState.players[gameState.currentPlayer]?.color ? 
                      COLORS[gameState.players[gameState.currentPlayer].color].gradient : '#60a5fa',
                    display: 'inline-block'
                  }} />
                  {gameState.players[gameState.currentPlayer]?.displayName}
                  {gameState.players[gameState.currentPlayer]?.isCPU ? ' 🤖' : ' 👑'}
                </div>
              </div>
              
              <div>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>DICE ROLL</div>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #FF3B5C, #8B5CF6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 20px rgba(255, 59, 92, 0.3)'
                }}>
                  {gameState.diceValue || '🎲'}
                </div>
              </div>
              
              <div>
                <button
                  onClick={rollDice}
                  disabled={isRolling || gameState.players[gameState.currentPlayer]?.isCPU}
                  style={{
                    padding: '1rem 2rem',
                    background: gameState.canMove && !gameState.players[gameState.currentPlayer]?.isCPU
                      ? 'linear-gradient(45deg, #3B82F6, #8B5CF6)'
                      : 'linear-gradient(45deg, #475569, #64748b)',
                    border: 'none',
                    borderRadius: '15px',
                    color: 'white',
                    fontFamily: '"Orbitron", sans-serif',
                    fontWeight: 'bold',
                    cursor: gameState.canMove && !gameState.players[gameState.currentPlayer]?.isCPU 
                      ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    width: '100%',
                    fontSize: '1.2rem',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (gameState.canMove && !gameState.players[gameState.currentPlayer]?.isCPU) {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (gameState.canMove && !gameState.players[gameState.currentPlayer]?.isCPU) {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {isRolling ? '🎲 ROLLING...' : '🎯 ROLL DICE'}
                </button>
              </div>
            </div>

            {/* Board and Dice Container */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '2rem',
              alignItems: 'start',
              marginBottom: '2rem'
            }}>
              {/* Board */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
                gap: '2px',
                width: 'min(600px, 100%)',
                height: '600px',
                margin: '0 auto',
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '10px',
                borderRadius: '15px',
                border: '3px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}>
                {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => {
                  const row = Math.floor(index / BOARD_SIZE);
                  const col = index % BOARD_SIZE;
                  return renderBoardCell(row, col);
                })}
              </div>

              {/* Dice Section */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2rem'
              }}>
                {/* 3D Dice */}
                <div 
                  ref={diceRef}
                  className="dice-3d"
                  style={{
                    animation: isRolling ? 'roll 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'float 3.5s ease-in-out infinite',
                    cursor: 'pointer',
                    transformStyle: 'preserve-3d',
                    width: 'clamp(100px, 20vw, 140px)',
                    height: 'clamp(100px, 20vw, 140px)'
                  }}
                  onClick={rollDice}
                  title="Click to roll!"
                >
                  {/* Front - 1 RED dot */}
                  <div className="dice-face front">
                    <div className="dot dot-1 red-dot">
                      <div className="dot-inner"></div>
                    </div>
                  </div>
                  {/* Back - 6 dots */}
                  <div className="dice-face back">
                    <div className="dot dot-1"><div className="dot-inner"></div></div>
                    <div className="dot dot-2"><div className="dot-inner"></div></div>
                    <div className="dot dot-3"><div className="dot-inner"></div></div>
                    <div className="dot dot-4"><div className="dot-inner"></div></div>
                    <div className="dot dot-5"><div className="dot-inner"></div></div>
                    <div className="dot dot-6"><div className="dot-inner"></div></div>
                  </div>
                  {/* Right - 4 dots */}
                  <div className="dice-face right">
                    <div className="dot dot-1"><div className="dot-inner"></div></div>
                    <div className="dot dot-2"><div className="dot-inner"></div></div>
                    <div className="dot dot-4"><div className="dot-inner"></div></div>
                    <div className="dot dot-5"><div className="dot-inner"></div></div>
                  </div>
                  {/* Left - 2 dots */}
                  <div className="dice-face left">
                    <div className="dot dot-1"><div className="dot-inner"></div></div>
                    <div className="dot dot-2"><div className="dot-inner"></div></div>
                  </div>
                  {/* Top - 5 dots */}
                  <div className="dice-face top">
                    <div className="dot dot-1"><div className="dot-inner"></div></div>
                    <div className="dot dot-2"><div className="dot-inner"></div></div>
                    <div className="dot dot-3"><div className="dot-inner"></div></div>
                    <div className="dot dot-4"><div className="dot-inner"></div></div>
                    <div className="dot dot-5"><div className="dot-inner"></div></div>
                  </div>
                  {/* Bottom - 3 dots */}
                  <div className="dice-face bottom">
                    <div className="dot dot-1"><div className="dot-inner"></div></div>
                    <div className="dot dot-3"><div className="dot-inner"></div></div>
                    <div className="dot dot-5"><div className="dot-inner"></div></div>
                  </div>

                  {/* Glow Effect */}
                  <div className="dice-glow" />
                </div>

                {/* Player Status */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  minWidth: '200px'
                }}>
                  {gameState.players.map(player => (
                    <div
                      key={player.id}
                      style={{
                        padding: '1rem',
                        background: `linear-gradient(135deg, ${COLORS[player.color].light}10, ${COLORS[player.color].secondary}10)`,
                        borderRadius: '12px',
                        border: `2px solid ${COLORS[player.color].primary}40`,
                        boxShadow: gameState.currentPlayer === player.id 
                          ? `0 0 25px ${COLORS[player.color].primary}40` 
                          : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          color: COLORS[player.color].primary,
                          fontSize: '1.1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: COLORS[player.color].gradient
                          }} />
                          {player.displayName}
                          {player.isCPU ? ' 🤖' : ' 👑'}
                        </div>
                        <div style={{
                          fontSize: '1.3rem',
                          fontWeight: 'bold',
                          color: COLORS[player.color].primary
                        }}>
                          {player.finishedPawns}/{PAWNS_PER_PLAYER}
                        </div>
                      </div>
                      
                      {/* Pawns */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '0.5rem',
                        justifyContent: 'center'
                      }}>
                        {player.pawns.map((pawn, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: pawn.state === 'home' || pawn.state === 'finished' 
                                ? COLORS[player.color].gradient 
                                : 'transparent',
                              border: `2px solid ${COLORS[player.color].primary}`,
                              opacity: pawn.state === 'home' || pawn.state === 'finished' ? 1 : 0.3,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              color: 'white'
                            }}
                          >
                            {pawn.state === 'finished' && '✓'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Instructions */}
            {!gameState.players[gameState.currentPlayer]?.isCPU && gameState.canMove && (
              <div style={{
                padding: '1rem',
                background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                marginBottom: '1rem'
              }}>
                <span style={{ 
                  color: '#60a5fa', 
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}>
                  {gameState.diceValue === 6 ? '🎲 You rolled a 6! Roll again after moving.' : '💡 Select a pawn to move!'}
                </span>
              </div>
            )}
          </>
        )}

        {/* Game Finished */}
        {gameState.phase === 'finished' && (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            animation: 'fadeInUp 0.6s ease-out'
          }}>
            <h2 style={{
              fontSize: '3rem',
              background: 'linear-gradient(45deg, #FFD700, #FFA500)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '2rem',
              textShadow: '0 0 30px rgba(255, 215, 0, 0.3)'
            }}>
              🏆 VICTORY! 🏆
            </h2>
            
            {/* Leaderboard */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.8)',
              borderRadius: '20px',
              padding: '2rem',
              marginBottom: '2rem',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              backdropFilter: 'blur(10px)',
              maxWidth: '500px',
              margin: '0 auto 2rem'
            }}>
              <h3 style={{ 
                color: '#FFD700', 
                marginBottom: '2rem',
                fontSize: '1.8rem'
              }}>FINAL STANDINGS</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {gameState.leaderboard
                  .sort((a, b) => a.position - b.position)
                  .map(entry => {
                    const isChampion = entry.position === 1;
                    return (
                      <div 
                        key={entry.playerId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1.2rem',
                          background: isChampion 
                            ? `linear-gradient(45deg, ${COLORS[entry.color].light}20, ${COLORS[entry.color].secondary}20)`
                            : 'rgba(15, 23, 42, 0.6)',
                          borderRadius: '15px',
                          border: `2px solid ${COLORS[entry.color].primary}`,
                          boxShadow: isChampion ? '0 10px 25px rgba(255, 215, 0, 0.2)' : 'none',
                          transform: isChampion ? 'scale(1.02)' : 'scale(1)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: COLORS[entry.color].gradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1.5rem',
                            boxShadow: `0 0 20px ${COLORS[entry.color].primary}`
                          }}>
                            {entry.position}
                          </div>
                          <div>
                            <div style={{ 
                              color: COLORS[entry.color].primary,
                              fontWeight: 'bold',
                              fontSize: '1.3rem'
                            }}>
                              {entry.name}
                            </div>
                            <div style={{ 
                              color: '#94a3b8', 
                              fontSize: '0.9rem',
                              marginTop: '0.2rem'
                            }}>
                              {entry.position === 1 ? 'CHAMPION 👑' : 
                               entry.position === 2 ? 'RUNNER-UP 🥈' : 
                               entry.position === 3 ? 'THIRD PLACE 🥉' : 'PARTICIPANT'}
                            </div>
                          </div>
                        </div>
                        <div style={{
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          background: 'linear-gradient(45deg, #FF3B5C, #8B5CF6)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          #{entry.position}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
            
            <button
              onClick={resetGame}
              style={{
                padding: '1.2rem 3rem',
                fontSize: '1.4rem',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #FF3B5C, #8B5CF6)',
                border: 'none',
                borderRadius: '25px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 15px 35px rgba(255, 59, 92, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 25px 45px rgba(255, 59, 92, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(255, 59, 92, 0.4)';
              }}
            >
              🔄 PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={() => setShowRules(false)}
        >
          <div 
            style={{
              background: 'linear-gradient(135deg, rgba(16, 14, 29, 0.95) 0%, rgba(26, 24, 48, 0.95) 100%)',
              borderRadius: '25px',
              padding: '3rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowRules(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#94a3b8',
                fontSize: '2rem',
                cursor: 'pointer',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,59,92,0.2)';
                e.currentTarget.style.color = '#FF3B5C';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              ×
            </button>
            
            <h2 style={{
              background: 'linear-gradient(45deg, #FF3B5C, #00D4AA, #3B82F6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '2rem',
              textAlign: 'center',
              fontSize: '2.5rem'
            }}>
              🎮 LUDO PRO GUIDE
            </h2>
            
            <div style={{ color: '#e2e8f0', lineHeight: '1.8' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#FF3B5C', marginBottom: '1rem', fontSize: '1.4rem' }}>🎲 GETTING STARTED</h3>
                <p>• Need a <strong>6</strong> to release pawns from home</p>
                <p>• Take turns clockwise around the board</p>
                <p>• CPU opponents: <strong>Aditi, Ankit, Souvik</strong></p>
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#00D4AA', marginBottom: '1rem', fontSize: '1.4rem' }}>⭐ SAFE ZONES</h3>
                <p>• <strong>Star positions (★)</strong> are protected areas</p>
                <p>• Pawns <strong>cannot be captured</strong> on safe spots</p>
                <p>• Strategic positions to regroup your pawns</p>
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#3B82F6', marginBottom: '1rem', fontSize: '1.4rem' }}>⚡ SPECIAL RULES</h3>
                <p>• Roll a <strong>6 = Extra turn!</strong></p>
                <p>• Land on opponent → Send them home (except safe spots)</p>
                <p>• Exact roll needed to enter home stretch</p>
                <p>• Multiple pawns can occupy same safe spot</p>
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#F59E0B', marginBottom: '1rem', fontSize: '1.4rem' }}>🏁 WINNING</h3>
                <p>• Move all <strong>4 pawns</strong> to the center home</p>
                <p>• First to finish wins immediately!</p>
                <p>• Other positions determined automatically</p>
              </div>
              
              <div style={{
                padding: '1.5rem',
                background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                borderRadius: '15px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                marginTop: '2rem'
              }}>
                <div style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  💡 PRO STRATEGY:
                </div>
                <p style={{ margin: 0 }}>
                  Keep your pawns together for protection! Getting a 6 early gives you 
                  a massive advantage. Use safe spots to regroup and plan attacks on opponents!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          overflow-x: hidden;
          font-family: 'Orbitron', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Dice 3D Styles */
        .dice-3d {
          position: relative;
          transform-style: preserve-3d;
        }

        .dice-face {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
          border: 3px solid #1e293b;
          border-radius: 16px;
          box-shadow: 
            inset 0 6px 12px rgba(0,0,0,0.15),
            0 10px 20px rgba(0,0,0,0.4),
            0 0 25px rgba(255,255,255,0.2);
          backface-visibility: hidden;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
          gap: 6px;
          padding: 10px;
          box-sizing: border-box;
          overflow: hidden;
        }

        .dice-face::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, transparent 60%, rgba(255,255,255,0.15));
          border-radius: 13px;
        }

        .dot {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .dot-inner {
          width: clamp(14px, 3vw, 18px);
          height: clamp(14px, 3vw, 18px);
          background: radial-gradient(circle, #374151 40%, #1f2937 70%);
          border-radius: 50%;
          box-shadow: 
            inset 2px 2px 4px rgba(0,0,0,0.3),
            0 1px 2px rgba(255,255,255,0.2);
        }

        .red-dot .dot-inner {
          background: radial-gradient(circle, #FF3B5C 40%, #d32f2f 70%);
          box-shadow: 
            inset 2px 2px 4px rgba(0,0,0,0.3),
            0 0 15px rgba(255,59,92,0.7);
          animation: redDotPulse 1s infinite;
        }

        /* Face positions */
        .front  { transform: translateZ(calc(clamp(100px, 20vw, 140px) / 2)); }
        .back   { transform: translateZ(calc(clamp(100px, 20vw, 140px) / -2)) rotateY(180deg); }
        .right  { transform: translateX(calc(clamp(100px, 20vw, 140px) / 2)) rotateY(90deg); }
        .left   { transform: translateX(calc(clamp(100px, 20vw, 140px) / -2)) rotateY(-90deg); }
        .top    { transform: translateY(calc(clamp(100px, 20vw, 140px) / -2)) rotateX(90deg); }
        .bottom { transform: translateY(calc(clamp(100px, 20vw, 140px) / 2)) rotateX(-90deg); }

        /* Dot positions */
        .front .dot-1 { grid-area: 2 / 2; }
        
        .back .dot-1 { grid-area: 1 / 1; }
        .back .dot-2 { grid-area: 1 / 3; }
        .back .dot-3 { grid-area: 2 / 2; }
        .back .dot-4 { grid-area: 3 / 1; }
        .back .dot-5 { grid-area: 3 / 3; }
        .back .dot-6 { grid-area: 1 / 2; }
        
        .right .dot-1 { grid-area: 1 / 1; }
        .right .dot-2 { grid-area: 1 / 3; }
        .right .dot-4 { grid-area: 3 / 1; }
        .right .dot-5 { grid-area: 3 / 3; }
        
        .left .dot-1 { grid-area: 1 / 1; }
        .left .dot-2 { grid-area: 3 / 3; }
        
        .top .dot-1 { grid-area: 1 / 1; }
        .top .dot-2 { grid-area: 1 / 3; }
        .top .dot-3 { grid-area: 2 / 2; }
        .top .dot-4 { grid-area: 3 / 1; }
        .top .dot-5 { grid-area: 3 / 3; }
        
        .bottom .dot-1 { grid-area: 1 / 1; }
        .bottom .dot-3 { grid-area: 2 / 2; }
        .bottom .dot-5 { grid-area: 3 / 3; }

        /* Dice Glow */
        .dice-glow {
          position: absolute;
          inset: -15px;
          background: radial-gradient(circle, rgba(255, 59, 92, 0.3) 0%, transparent 70%);
          border-radius: 30px;
          filter: blur(15px);
          z-index: -1;
          animation: glowPulse 2s ease-in-out infinite;
          opacity: 0.6;
        }

        /* Animations */
        @keyframes roll {
          0% { 
            transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateY(0px);
          }
          100% { 
            transform: rotateX(720deg) rotateY(720deg) rotateZ(360deg) translateY(-20px);
          }
        }

        @keyframes float {
          0%, 100% { 
            transform: rotateX(360deg) rotateY(360deg) translateY(0px); 
          }
          50% { 
            transform: rotateX(370deg) rotateY(370deg) translateY(-15px); 
          }
        }

        @keyframes floatParticle {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes explode {
          0% { transform: scale(1) translate(0, 0); opacity: 0.8; }
          100% { transform: scale(0) translate(var(--tx, 50px), var(--ty, -50px)); opacity: 0; }
        }

        @keyframes glowPulse {
          0%, 100% { 
            opacity: 0.5;
            transform: scale(1);
          }
          50% { 
            opacity: 0.7;
            transform: scale(1.05);
          }
        }

        @keyframes redDotPulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 
              inset 2px 2px 4px rgba(0,0,0,0.3),
              0 0 15px rgba(255,59,92,0.7);
          }
          50% { 
            transform: scale(1.1);
            box-shadow: 
              inset 2px 2px 4px rgba(0,0,0,0.3),
              0 0 25px rgba(255,59,92,0.9);
          }
        }

        @keyframes borderPulse {
          0%, 100% { 
            opacity: 0.4;
          }
          50% { 
            opacity: 0.7;
          }
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes starTwinkle {
          0%, 100% { 
            opacity: 0.6;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2);
          }
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .dice-3d {
            width: 90px !important;
            height: 90px !important;
          }

          .board-cell {
            width: 30px !important;
            height: 30px !important;
          }
        }

        @media (max-width: 768px) {
          .dice-3d {
            width: 80px !important;
            height: 80px !important;
          }

          .dice-face {
            gap: 4px;
            padding: 8px;
          }

          .dot-inner {
            width: 10px;
            height: 10px;
          }

          .board-cell {
            width: 25px !important;
            height: 25px !important;
          }

          .main-container {
            padding: 1rem !important;
          }
        }

        @media (max-width: 480px) {
          .dice-3d {
            width: 70px !important;
            height: 70px !important;
          }

          .dot-inner {
            width: 8px;
            height: 8px;
          }

          .board-cell {
            width: 20px !important;
            height: 20px !important;
          }

          .rules-button {
            padding: 10px 20px !important;
            font-size: 0.9rem !important;
          }
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.8);
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #FF3B5C, #8B5CF6);
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #8B5CF6, #FF3B5C);
        }
      `}</style>
    </div>
  );
};

export default Ludo;