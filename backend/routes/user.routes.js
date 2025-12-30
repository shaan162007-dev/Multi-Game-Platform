const express = require('express');
const router = express.Router();

// GET /api/users - Get all users (protected in real app)
router.get('/', (req, res) => {
  res.json({
    success: true,
    count: 3,
    users: [
      {
        id: 1,
        username: 'player1',
        email: 'player1@example.com',
        gamesPlayed: 42,
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        username: 'player2',
        email: 'player2@example.com',
        gamesPlayed: 28,
        createdAt: '2024-02-20T14:45:00Z'
      },
      {
        id: 3,
        username: 'player3',
        email: 'player3@example.com',
        gamesPlayed: 15,
        createdAt: '2024-03-10T09:15:00Z'
      }
    ]
  });
});

// GET /api/users/profile - Get user profile
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      stats: {
        totalGames: 42,
        wins: 28,
        losses: 14,
        winRate: '66.7%'
      },
      preferences: {
        theme: 'dark',
        notifications: true
      }
    }
  });
});

// GET /api/users/:id - Get user by ID
router.get('/:id', (req, res) => {
  const users = [
    { id: 1, username: 'player1' },
    { id: 2, username: 'player2' },
    { id: 3, username: 'player3' }
  ];
  
  const user = users.find(u => u.id === parseInt(req.params.id));
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User with id ${req.params.id} not found`
    });
  }
  
  res.json({
    success: true,
    user: {
      ...user,
      email: `${user.username}@example.com`,
      joined: new Date().toISOString(),
      status: 'active'
    }
  });
});

module.exports = router;