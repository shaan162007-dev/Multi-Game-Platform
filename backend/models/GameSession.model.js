const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  gameType: {
    type: String,
    required: true,
    enum: ['tictactoe', 'handcricket', 'ludo', 'snake', 'uno', 'snakeladder' , 'mathgames']
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    avatar: String,
    score: {
      type: Number,
      default: 0
    },
    isReady: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxPlayers: {
    type: Number,
    default: 2
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'finished', 'cancelled'],
    default: 'waiting'
  },
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    password: String,
    timeLimit: Number,
    maxRounds: Number,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    }
  },
  gameState: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  currentTurn: {
    type: Number,
    default: 0
  },
  winner: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    reason: String
  },
  startedAt: Date,
  finishedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Auto delete after 24 hours
  }
});

// Start the game
gameSessionSchema.methods.startGame = async function() {
  this.status = 'active';
  this.startedAt = Date.now();
  await this.save();
};

// End the game
gameSessionSchema.methods.endGame = async function(winnerData) {
  this.status = 'finished';
  this.finishedAt = Date.now();
  this.winner = winnerData;
  await this.save();
};

// Add player to game
gameSessionSchema.methods.addPlayer = async function(playerData) {
  if (this.players.length >= this.maxPlayers) {
    throw new Error('Game is full');
  }
  
  this.players.push({
    ...playerData,
    joinedAt: Date.now()
  });
  
  await this.save();
};

// Remove player from game
gameSessionSchema.methods.removePlayer = async function(userId) {
  this.players = this.players.filter(player => 
    player.userId.toString() !== userId.toString()
  );
  await this.save();
};

// Update player score
gameSessionSchema.methods.updatePlayerScore = async function(userId, score) {
  const player = this.players.find(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (player) {
    player.score = score;
    await this.save();
  }
};

// Update game state
gameSessionSchema.methods.updateGameState = async function(gameState) {
  this.gameState = gameState;
  await this.save();
};

const GameSession = mongoose.model('GameSession', gameSessionSchema);

module.exports = GameSession;