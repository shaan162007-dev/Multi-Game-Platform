const GameSession = require('../models/GameSession.model');
const GameStats = require('../models/GameStats.model');
const User = require('../models/User.model');
const { generateGameId } = require('../utils/helpers');
const { calculateXP, calculatePoints } = require('../utils/gameLogic');

// @desc    Create new game
// @route   POST /api/games/create
// @access  Private
exports.createGame = async (req, res, next) => {
  try {
    const { gameType, settings = {} } = req.body;
    const userId = req.user.id;
    
    // Get user info
    const user = await User.findById(userId);
    
    // Generate game ID
    const gameId = generateGameId(gameType);
    
    // Create game session
    const gameSession = await GameSession.create({
      gameId,
      gameType,
      players: [{
        userId: user._id,
        username: user.username,
        avatar: user.avatar,
        isReady: true,
        joinedAt: Date.now()
      }],
      settings: {
        isPrivate: settings.isPrivate || false,
        password: settings.password || null,
        timeLimit: settings.timeLimit || null,
        maxRounds: settings.maxRounds || null,
        difficulty: settings.difficulty || 'medium'
      }
    });
    
    res.status(201).json({
      success: true,
      data: gameSession
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join game
// @route   POST /api/games/:gameId/join
// @access  Private
exports.joinGame = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { password } = req.body;
    const userId = req.user.id;
    
    // Find game
    const gameSession = await GameSession.findOne({ gameId });
    
    if (!gameSession) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // Check if game is full
    if (gameSession.players.length >= gameSession.maxPlayers) {
      return res.status(400).json({
        success: false,
        message: 'Game is full'
      });
    }
    
    // Check if private game
    if (gameSession.settings.isPrivate) {
      if (!password || gameSession.settings.password !== password) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password'
        });
      }
    }
    
    // Check if already joined
    const alreadyJoined = gameSession.players.some(
      player => player.userId.toString() === userId
    );
    
    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: 'Already joined this game'
      });
    }
    
    // Get user info
    const user = await User.findById(userId);
    
    // Add player
    await gameSession.addPlayer({
      userId: user._id,
      username: user.username,
      avatar: user.avatar,
      isReady: false
    });
    
    res.status(200).json({
      success: true,
      data: gameSession
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get game by ID
// @route   GET /api/games/:gameId
// @access  Private
exports.getGame = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    
    const gameSession = await GameSession.findOne({ gameId })
      .populate('players.userId', 'username avatar level')
      .populate('winner.userId', 'username avatar');
    
    if (!gameSession) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: gameSession
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active games
// @route   GET /api/games/active
// @access  Public
exports.getActiveGames = async (req, res, next) => {
  try {
    const { gameType, limit = 20 } = req.query;
    
    const query = { 
      status: 'waiting',
      'settings.isPrivate': false 
    };
    
    if (gameType) {
      query.gameType = gameType;
    }
    
    const games = await GameSession.find(query)
      .populate('players.userId', 'username avatar')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: games.length,
      data: games
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End game and update stats
// @route   POST /api/games/:gameId/end
// @access  Private
exports.endGame = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { winnerData, scores, timePlayed = 5 } = req.body;
    
    // Find game
    const gameSession = await GameSession.findOne({ gameId });
    
    if (!gameSession) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // End game session
    await gameSession.endGame(winnerData);
    
    // Update stats for each player
    for (const player of gameSession.players) {
      const playerId = player.userId.toString();
      const playerScore = scores?.[playerId] || player.score || 0;
      
      // Determine result
      let result = 'loss';
      if (winnerData && winnerData.userId) {
        if (playerId === winnerData.userId.toString()) {
          result = 'win';
        }
      }
      
      // Get or create game stats
      let gameStats = await GameStats.findOne({
        user: playerId,
        gameType: gameSession.gameType
      });
      
      if (!gameStats) {
        gameStats = await GameStats.create({
          user: playerId,
          gameType: gameSession.gameType
        });
      }
      
      // Update game stats
      await gameStats.updateStats(result, playerScore, timePlayed);
      
      // Update user stats
      const user = await User.findById(playerId);
      
      if (result === 'win') {
        user.totalWins += 1;
        user.gamesPlayed[gameSession.gameType] += 1;
      } else {
        user.totalLosses += 1;
        user.gamesPlayed[gameSession.gameType] += 1;
      }
      
      // Calculate and add XP
      const xp = calculateXP(result, gameSession.gameType, playerScore);
      await user.addXP(xp);
      
      // Calculate and add points
      const points = calculatePoints(result, playerScore);
      user.totalPoints += points;
      
      await user.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Game ended and stats updated'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave game
// @route   DELETE /api/games/:gameId/leave
// @access  Private
exports.leaveGame = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;
    
    const gameSession = await GameSession.findOne({ gameId });
    
    if (!gameSession) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // Remove player
    await gameSession.removePlayer(userId);
    
    // If no players left, delete game
    if (gameSession.players.length === 0) {
      await gameSession.deleteOne();
    }
    
    res.status(200).json({
      success: true,
      message: 'Left game successfully'
    });
  } catch (error) {
    next(error);
  }
};