const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load env vars
dotenv.config();

// Import database connection
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const gameRoutes = require('./routes/game.routes');
const userRoutes = require('./routes/user.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');

// Import middleware
const errorHandler = require('./middleware/error.middleware');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  message: 'Too many requests from this IP, please try again later.'
});

// Apply security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(limiter);
app.use(mongoSanitize());
app.use(xss());

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Add this after body parser and before your routes
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.originalUrl}`);
  next();
});

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: '🎮 Multi-Game Platform API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      games: '/api/games',
      users: '/api/users',
      leaderboard: '/api/leaderboard'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Add this after the /health route and before other API routes
app.get('/api', (req, res) => {
  res.json({
    message: '🎮 Multi-Game Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      games: '/api/games',
      users: '/api/users',
      leaderboard: '/api/leaderboard',
      docs: 'Coming soon...'
    },
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use(errorHandler);

// Socket.io events
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // Join game room
  socket.on('join-game', (gameId) => {
    socket.join(gameId);
    console.log(`🎮 Socket ${socket.id} joined game ${gameId}`);
    
    // Notify others in the room
    socket.to(gameId).emit('player-joined', {
      playerId: socket.id,
      timestamp: Date.now()
    });
  });
  
  // Leave game room
  socket.on('leave-game', (gameId) => {
    socket.leave(gameId);
    console.log(`🎮 Socket ${socket.id} left game ${gameId}`);
    
    // Notify others in the room
    socket.to(gameId).emit('player-left', {
      playerId: socket.id,
      timestamp: Date.now()
    });
  });
  
  // Game move
  socket.on('game-move', (data) => {
    const { gameId, move, playerId } = data;
    console.log(`🎮 Move in game ${gameId} by player ${playerId}`);
    
    // Broadcast move to all players in the game
    socket.to(gameId).emit('move-update', {
      move,
      playerId,
      timestamp: Date.now()
    });
  });
  
  // Game chat
  socket.on('game-chat', (data) => {
    const { gameId, message, playerName } = data;
    
    // Broadcast chat message to all players in the game
    io.to(gameId).emit('chat-message', {
      message,
      playerName,
      timestamp: Date.now()
    });
  });
  
  // Game state update
  socket.on('game-state', (data) => {
    const { gameId, state } = data;
    
    // Broadcast game state to all players in the game
    socket.to(gameId).emit('state-update', {
      state,
      timestamp: Date.now()
    });
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Connect to database and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`🎮 Socket.io ready for connections`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

// Start the server
startServer();

module.exports = { app, server, io };