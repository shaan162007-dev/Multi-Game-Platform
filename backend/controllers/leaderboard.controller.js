const Leaderboard = require('../models/Leaderboard.model');
const User = require('../models/User.model');
const GameStats = require('../models/GameStats.model');

// @desc    Get leaderboard
// @route   GET /api/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { gameType = 'overall', period = 'all-time', limit = 50 } = req.query;
    
    // Find or create leaderboard
    let leaderboard = await Leaderboard.findOne({ gameType, period });
    
    if (!leaderboard) {
      // Create new leaderboard with top players
      const topPlayers = await getTopPlayers(gameType, period, parseInt(limit));
      leaderboard = await Leaderboard.create({
        gameType,
        period,
        entries: topPlayers
      });
    }
    
    // Check if leaderboard needs refresh (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 3600000);
    if (leaderboard.lastUpdated < oneHourAgo) {
      const topPlayers = await getTopPlayers(gameType, period, parseInt(limit));
      leaderboard.entries = topPlayers;
      leaderboard.lastUpdated = Date.now();
      await leaderboard.save();
    }
    
    res.status(200).json({
      success: true,
      data: {
        gameType,
        period,
        lastUpdated: leaderboard.lastUpdated,
        entries: leaderboard.entries.slice(0, parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user rank
// @route   GET /api/leaderboard/rank
// @access  Private
exports.getUserRank = async (req, res, next) => {
  try {
    const { gameType = 'overall', period = 'all-time' } = req.query;
    const userId = req.user.id;
    
    const leaderboard = await Leaderboard.findOne({ gameType, period });
    
    if (!leaderboard) {
      return res.status(404).json({
        success: false,
        message: 'Leaderboard not found'
      });
    }
    
    const userEntry = leaderboard.entries.find(entry => 
      entry.user.toString() === userId
    );
    
    if (!userEntry) {
      return res.status(200).json({
        success: true,
        data: {
          rank: null,
          message: 'User not in leaderboard'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        rank: userEntry.rank,
        score: userEntry.score,
        wins: userEntry.wins,
        losses: userEntry.losses,
        winRate: userEntry.winRate
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to get top players
async function getTopPlayers(gameType, period, limit) {
  let query = {};
  let scoreField = 'totalPoints';
  
  if (gameType !== 'overall') {
    // Get game-specific stats
    const gameStats = await GameStats.find({ gameType })
      .populate('user', 'username avatar')
      .sort({ wins: -1, averageScore: -1 })
      .limit(limit);
    
    return gameStats.map((stat, index) => ({
      user: stat.user._id,
      username: stat.user.username,
      avatar: stat.user.avatar,
      score: stat.wins * 100 + stat.averageScore,
      rank: index + 1,
      wins: stat.wins,
      losses: stat.losses,
      winRate: stat.wins / (stat.wins + stat.losses) * 100,
      gamesPlayed: stat.totalGames,
      lastUpdated: Date.now()
    }));
  }
  
  // Overall leaderboard
  const users = await User.find({})
    .sort({ totalPoints: -1, level: -1 })
    .limit(limit)
    .select('username avatar totalPoints level totalWins totalLosses');
  
  return users.map((user, index) => ({
    user: user._id,
    username: user.username,
    avatar: user.avatar,
    score: user.totalPoints,
    rank: index + 1,
    wins: user.totalWins,
    losses: user.totalLosses,
    winRate: user.totalWins / (user.totalWins + user.totalLosses) * 100,
    gamesPlayed: Object.values(user.gamesPlayed).reduce((a, b) => a + b, 0),
    lastUpdated: Date.now()
  }));
}