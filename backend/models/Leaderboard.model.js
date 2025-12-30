const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  gameType: {
    type: String,
    required: true,
    enum: ['tictactoe', 'handcricket', 'ludo', 'snake', 'uno', 'snakeladder', 'mathgames', 'overall']
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'all-time'],
    default: 'all-time'
  },
  entries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    avatar: String,
    score: Number,
    rank: Number,
    wins: Number,
    losses: Number,
    winRate: Number,
    gamesPlayed: Number,
    lastUpdated: Date
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    index: { expires: 0 }
  }
}, {
  timestamps: true
});

// Update leaderboard entry
leaderboardSchema.methods.updateEntry = async function(userId, data) {
  const entryIndex = this.entries.findIndex(entry => 
    entry.user.toString() === userId.toString()
  );
  
  if (entryIndex > -1) {
    // Update existing entry
    this.entries[entryIndex] = {
      ...this.entries[entryIndex],
      ...data,
      lastUpdated: Date.now()
    };
  } else {
    // Add new entry
    this.entries.push({
      user: userId,
      ...data,
      rank: this.entries.length + 1,
      lastUpdated: Date.now()
    });
  }
  
  // Sort by score and update ranks
  this.entries.sort((a, b) => b.score - a.score);
  this.entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  this.lastUpdated = Date.now();
  await this.save();
};

// Get top players
leaderboardSchema.methods.getTopPlayers = function(limit = 10) {
  return this.entries.slice(0, limit);
};

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

module.exports = Leaderboard;