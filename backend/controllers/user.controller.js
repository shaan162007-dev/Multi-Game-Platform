const User = require('../models/User.model');
const GameStats = require('../models/GameStats.model');

// @desc    Get user profile
// @route   GET /api/users/:userId
// @access  Public
exports.getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-password')
      .populate('friends', 'username avatar level');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get game stats
    const gameStats = await GameStats.find({ user: userId });
    
    res.status(200).json({
      success: true,
      data: {
        user,
        gameStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
exports.searchUsers = async (req, res, next) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }
    
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('username avatar level totalPoints')
    .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updates = req.body;
    
    // Fields that can be updated
    const allowedUpdates = ['avatar', 'bio'];
    const updateData = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user stats
// @route   GET /api/users/:userId/stats
// @access  Public
exports.getUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const gameStats = await GameStats.find({ user: userId });
    
    // Calculate totals
    const totals = gameStats.reduce((acc, stat) => {
      acc.totalGames += stat.totalGames;
      acc.totalWins += stat.wins;
      acc.totalLosses += stat.losses;
      acc.totalDraws += stat.draws;
      acc.totalScore += stat.totalScore;
      return acc;
    }, {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      totalDraws: 0,
      totalScore: 0
    });
    
    res.status(200).json({
      success: true,
      data: {
        gameStats,
        totals
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add friend
// @route   POST /api/users/friends/add
// @access  Private
exports.addFriend = async (req, res, next) => {
  try {
    const { friendId } = req.body;
    const userId = req.user.id;
    
    if (userId === friendId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add yourself as friend'
      });
    }
    
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);
    
    if (!friend) {
      return res.status(404).json({
        success: false,
        message: 'Friend not found'
      });
    }
    
    // Add friend
    await user.addFriend(friendId);
    
    res.status(200).json({
      success: true,
      message: 'Friend added successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get friends
// @route   GET /api/users/friends
// @access  Private
exports.getFriends = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('friends', 'username avatar level totalPoints lastActive');
    
    res.status(200).json({
      success: true,
      data: user.friends
    });
  } catch (error) {
    next(error);
  }
};