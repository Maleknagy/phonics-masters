const Level = require('../models/Level');
const Unit = require('../models/Unit');

// @desc    Get all levels
// @route   GET /api/levels
// @access  Private
exports.getLevels = async (req, res) => {
  try {
    const levels = await Level.find().sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: levels.length,
      levels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single level AND its units
// @route   GET /api/levels/:id
// @access  Private
exports.getLevel = async (req, res) => {
  try {
    // 1. Find the Level
    const level = await Level.findById(req.params.id);

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }

    // 2. Find the Units for this Level
    // We search for units where the 'level' field matches this level's ID
    const units = await Unit.find({ level: req.params.id }).sort({ order: 1 });

    // 3. Send BOTH back to the frontend
    res.status(200).json({
      success: true,
      level,
      units 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create level (Admin only)
// @route   POST /api/levels
exports.createLevel = async (req, res) => {
  try {
    const level = await Level.create(req.body);
    res.status(201).json({ success: true, level });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update level (Admin only)
// @route   PUT /api/levels/:id
exports.updateLevel = async (req, res) => {
  try {
    const level = await Level.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!level) return res.status(404).json({ success: false, message: 'Level not found' });
    res.status(200).json({ success: true, level });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete level (Admin only)
// @route   DELETE /api/levels/:id
exports.deleteLevel = async (req, res) => {
  try {
    const level = await Level.findByIdAndDelete(req.params.id);
    if (!level) return res.status(404).json({ success: false, message: 'Level not found' });
    res.status(200).json({ success: true, message: 'Level deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};