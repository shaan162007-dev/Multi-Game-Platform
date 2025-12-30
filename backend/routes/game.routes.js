const express = require('express');
const router = express.Router();

// GET /api/games - Get all games
router.get('/', (req, res) => {
  res.json({
    success: true,
    count: 3,
    games: [
      {
        id: 1,
        name: 'Tic Tac Toe',
        description: 'Classic 3x3 game',
        category: 'strategy',
        multiplayer: true,
        difficulty: 'easy'
      },
      {
        id: 2,
        name: 'Memory Match',
        description: 'Card matching game',
        category: 'puzzle',
        multiplayer: false,
        difficulty: 'medium'
      },
      {
        id: 3,
        name: 'Snake',
        description: 'Classic snake game',
        category: 'arcade',
        multiplayer: false,
        difficulty: 'easy'
      }
    ]
  });
});

// GET /api/games/:id - Get specific game
router.get('/:id', (req, res) => {
  const games = [
    { id: 1, name: 'Tic Tac Toe' },
    { id: 2, name: 'Memory Match' },
    { id: 3, name: 'Snake' }
  ];
  
  const game = games.find(g => g.id === parseInt(req.params.id));
  
  if (!game) {
    return res.status(404).json({
      success: false,
      message: `Game with id ${req.params.id} not found`
    });
  }
  
  res.json({
    success: true,
    game: {
      ...game,
      description: 'A fun game for all ages',
      instructions: 'Click to play!',
      createdAt: new Date().toISOString()
    }
  });
});

// POST /api/games/:id/play - Play a game
router.post('/:id/play', (req, res) => {
  res.json({
    success: true,
    message: `Started playing game ${req.params.id}`,
    sessionId: 'session_' + Date.now(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;