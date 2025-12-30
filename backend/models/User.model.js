const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: 'default_avatar.png'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  gamesPlayed: {
    tictactoe: { type: Number, default: 0 },
    handcricket: { type: Number, default: 0 },
    ludo: { type: Number, default: 0 },
    snake: { type: Number, default: 0 },
    uno: { type: Number, default: 0 },
    snakeladder: { type: Number, default: 0 },
    mathgames: { type: Number, default: 0 }
  },
  totalWins: {
    type: Number,
    default: 0
  },
  totalLosses: {
    type: Number,
    default: 0
  },
  totalDraws: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  achievements: [{
    name: String,
    game: String,
    icon: String,
    date: Date
  }],
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update last active
userSchema.methods.updateLastActive = async function() {
  this.lastActive = Date.now();
  await this.save();
};

// Method to add XP
userSchema.methods.addXP = async function(amount) {
  this.xp += amount;
  
  // Level up logic (100 XP per level)
  const newLevel = Math.floor(this.xp / 100) + 1;
  if (newLevel > this.level) {
    this.level = newLevel;
  }
  
  await this.save();
  return this.level;
};

// Method to add achievement
userSchema.methods.addAchievement = async function(achievement) {
  this.achievements.push({
    ...achievement,
    date: Date.now()
  });
  await this.save();
};

// Method to add friend
userSchema.methods.addFriend = async function(friendId) {
  if (!this.friends.includes(friendId)) {
    this.friends.push(friendId);
    await this.save();
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;