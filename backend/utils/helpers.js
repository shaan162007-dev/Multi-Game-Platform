// Generate JWT Token
exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Send token response
exports.sendTokenResponse = (user, statusCode, res) => {
  const token = exports.generateToken(user._id);
  
  // Remove password from output
  user.password = undefined;
  
  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user
    }
  });
};

// Generate random game ID
exports.generateGameId = (gameType) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${gameType}_${timestamp}_${random}`;
};

// Calculate win rate
exports.calculateWinRate = (wins, games) => {
  return games > 0 ? ((wins / games) * 100).toFixed(1) : 0;
};

// Format duration
exports.formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

// Check if user is in game
exports.isUserInGame = (gameSession, userId) => {
  return gameSession.players.some(player => 
    player.userId.toString() === userId.toString()
  );
};

// Get player position in game
exports.getPlayerPosition = (gameSession, userId) => {
  return gameSession.players.findIndex(player => 
    player.userId.toString() === userId.toString()
  );
};