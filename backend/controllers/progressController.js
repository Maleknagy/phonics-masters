const UserProgress = require('../models/UserProgress');
const User = require('../models/User');

// @desc    Get user stats
// @route   GET /api/progress/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    const userProgress = await UserProgress.find({ userId: req.user.id });
    const user = await User.findById(req.user.id);

    const completedUnits = userProgress.filter(p => p.isCompleted).length;
    const totalStars = userProgress.reduce((sum, p) => sum + (p.totalStars || 0), 0);
    const totalPoints = userProgress.reduce((sum, p) => sum + (p.totalScore || 0), 0);

    const stats = {
      totalStars: totalStars,
      totalPoints: totalPoints,
      totalUnitsCompleted: completedUnits,
      currentLevel: user.currentLevel || 1,
      currentUnit: user.currentUnit || 1
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
