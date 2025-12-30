const express = require('express');
const router = express.Router();

// GET /api/auth/status - Auth status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    authenticated: false,
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

// POST /api/auth/register - Register new user
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide username, email and password'
    });
  }
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: {
      id: Date.now(),
      username,
      email,
      createdAt: new Date().toISOString()
    },
    token: 'dummy-jwt-token-' + Date.now()
  });
});

// POST /api/auth/login - Login user
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }
  
  // Mock authentication
  if (email === 'test@example.com' && password === 'password123') {
    return res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      },
      token: 'dummy-jwt-token-' + Date.now()
    });
  }
  
  res.status(401).json({
    success: false,
    message: 'Invalid credentials'
  });
});

// GET /api/auth/logout - Logout user
router.get('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;