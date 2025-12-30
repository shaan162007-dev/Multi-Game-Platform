module.exports = {
  // Game Types
  GAME_TYPES: {
    TIC_TAC_TOE: 'tictactoe',
    HAND_CRICKET: 'handcricket',
    LUDO: 'ludo',
    SNAKE: 'snake',
    UNO: 'uno',
    SNAKE_LADDER: 'snakeladder',
    MATH_GAMES: 'mathgames'
  },
  
  // Game Status
  GAME_STATUS: {
    WAITING: 'waiting',
    ACTIVE: 'active',
    PAUSED: 'paused',
    FINISHED: 'finished',
    CANCELLED: 'cancelled'
  },
  
  // User Roles
  USER_ROLES: {
    USER: 'user',
    ADMIN: 'admin'
  },
  
  // Leaderboard Periods
  LEADERBOARD_PERIODS: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    ALL_TIME: 'all-time'
  },
  
  // XP System
  XP_CONSTANTS: {
    WIN_XP: 50,
    LOSS_XP: 20,
    DRAW_XP: 30,
    PERFECT_WIN_XP: 100,
    LEVEL_UP_XP: 100
  },
  
  // Points System
  POINTS_CONSTANTS: {
    WIN_POINTS: 100,
    LOSS_POINTS: 10,
    DRAW_POINTS: 50
  }
};