const mongoose = require('mongoose');

const gameStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameType: {
    type: String,
    required: true,
    enum: ['tictactoe', 'handcricket', 'ludo', 'snake', 'uno', 'snakeladder', 'mathgames']
  },
  totalGames: {
    type: Number,
    default: 0
  },
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  draws: {
    type: Number,
    default: 0
  },
  totalScore: {
    type: Number,
    default: 0
  },
  highestScore: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  winStreak: {
    type: Number,
    default: 0
  },
  bestWinStreak: {
    type: Number,
    default: 0
  },
  totalTimePlayed: {
    type: Number,
    default: 0
  },
  achievements: [{
    name: String,
    description: String,
    date: Date
  }],
  lastPlayed: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update stats after a game
gameStatsSchema.methods.updateStats = async function(result, score = 0, timePlayed = 0) {
  this.totalGames += 1;
  this.totalTimePlayed += timePlayed;
  this.lastPlayed = Date.now();
  this.totalScore += score;
  
  if (result === 'win') {
    this.wins += 1;
    this.winStreak += 1;
    if (this.winStreak > this.bestWinStreak) {
      this.bestWinStreak = this.winStreak;
    }
  } else if (result === 'loss') {
    this.losses += 1;
    this.winStreak = 0;
  } else if (result === 'draw') {
    this.draws += 1;
    this.winStreak = 0;
  }
  
  if (score > this.highestScore) {
    this.highestScore = score;
  }
  
  this.averageScore = this.totalScore / this.totalGames;
  
  await this.save();
};

// Add achievement
gameStatsSchema.methods.addAchievement = async function(achievement) {
  this.achievements.push({
    ...achievement,
    date: Date.now()
  });
  await this.save();
};

const GameStats = mongoose.model('GameStats', gameStatsSchema);

module.exports = GameStats;