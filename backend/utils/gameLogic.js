const constants = require('../config/constants');

// Game-specific logic utilities

// Tic Tac Toe logic
exports.tictactoe = {
  checkWinner: (board) => {
    const winningCombos = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6] // Diagonals
    ];
    
    for (const combo of winningCombos) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    
    // Check for draw
    if (board.every(cell => cell !== null)) {
      return 'draw';
    }
    
    return null;
  },
  
  calculateScore: (result, timeTaken) => {
    if (result === 'win') {
      return 100 - Math.min(timeTaken, 90); // Faster wins get more points
    } else if (result === 'draw') {
      return 50;
    }
    return 10; // Participation points for loss
  }
};

// Hand Cricket logic
exports.handcricket = {
  calculateScore: (runs, balls, isWin) => {
    let baseScore = runs * 2;
    const strikeRate = (runs / balls) * 100;
    
    if (strikeRate > 100) baseScore *= 1.5;
    if (isWin) baseScore *= 2;
    
    return Math.round(baseScore);
  }
};

// Ludo logic
exports.ludo = {
  calculateScore: (position, timeTaken, isWin) => {
    let score = 0;
    
    if (position === 1) score = 100;
    else if (position === 2) score = 75;
    else if (position === 3) score = 50;
    else score = 25;
    
    // Time bonus (faster = more points)
    const timeBonus = Math.max(0, 100 - timeTaken);
    score += timeBonus;
    
    if (isWin) score *= 1.5;
    
    return Math.round(score);
  }
};

// Calculate XP based on game result
exports.calculateXP = (result, gameType, score) => {
  let xp = constants.XP_CONSTANTS.LOSS_XP;
  
  if (result === 'win') {
    xp = constants.XP_CONSTANTS.WIN_XP;
    
    // Perfect win bonus
    if (score >= 90) {
      xp = constants.XP_CONSTANTS.PERFECT_WIN_XP;
    }
  } else if (result === 'draw') {
    xp = constants.XP_CONSTANTS.DRAW_XP;
  }
  
  // Game type multiplier
  const multipliers = {
    tictactoe: 1,
    handcricket: 1.2,
    ludo: 1.5,
    snake: 1,
    uno: 1.3,
    snakeladder: 1.2
  };
  
  return Math.round(xp * (multipliers[gameType] || 1));
};

// Calculate points based on result
exports.calculatePoints = (result, score) => {
  if (result === 'win') {
    return constants.POINTS_CONSTANTS.WIN_POINTS + Math.floor(score / 10);
  } else if (result === 'draw') {
    return constants.POINTS_CONSTANTS.DRAW_POINTS;
  }
  return constants.POINTS_CONSTANTS.LOSS_POINTS;
};