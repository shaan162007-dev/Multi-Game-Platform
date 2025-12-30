const express = require('express');
const router = express.Router();

// GET /api/leaderboard - Get global leaderboard
router.get('/', (req, res) => {
  res.json({
    success: true,
    leaderboard: [
      {
        rank: 1,
        username: 'champion',
        score: 9850,
        gamesPlayed: 150,
        winRate: '85%',
        favoriteGame: 'Tic Tac Toe'
      },
      {
        rank: 2,
        username: 'proplayer',
        score: 8420,
        gamesPlayed: 120,
        winRate: '78%',
        favoriteGame: 'Memory Match'
      },
      {
        rank: 3,
        username: 'gamer123',
        score: 7650,
        gamesPlayed: 95,
        winRate: '72%',
        favoriteGame: 'Snake'
      },
      {
        rank: 4,
        username: 'newbie',
        score: 4320,
        gamesPlayed: 65,
        winRate: '65%',
        favoriteGame: 'Tic Tac Toe'
      },
      {
        rank: 5,
        username: 'casual',
        score: 3210,
        gamesPlayed: 45,
        winRate: '60%',
        favoriteGame: 'Memory Match'
      }
    ],
    updatedAt: new Date().toISOString()
  });
});

// GET /api/leaderboard/:gameId - Get game-specific leaderboard
router.get('/:gameId', (req, res) => {
  const gameNames = {
    1: 'Tic Tac Toe',
    2: 'Memory Match',
    3: 'Snake'
  };
  
  const gameName = gameNames[req.params.gameId] || 'Unknown Game';
  
  res.json({
    success: true,
    gameId: req.params.gameId,
    gameName,
    leaderboard: [
      {
        rank: 1,
        username: 'master_' + gameName.replace(/\s+/g, ''),
        score: Math.floor(Math.random() * 10000),
        wins: Math.floor(Math.random() * 100),
        played: Math.floor(Math.random() * 150)
      },
      {
        rank: 2,
        username: 'expert_' + gameName.replace(/\s+/g, ''),
        score: Math.floor(Math.random() * 8000),
        wins: Math.floor(Math.random() * 80),
        played: Math.floor(Math.random() * 120)
      },
      {
        rank: 3,
        username: 'skilled_' + gameName.replace(/\s+/g, ''),
        score: Math.floor(Math.random() * 6000),
        wins: Math.floor(Math.random() * 60),
        played: Math.floor(Math.random() * 90)
      }
    ]
  });
});

module.exports = router;