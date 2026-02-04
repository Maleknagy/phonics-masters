const Unit = require('../models/Unit');
const UserProgress = require('../models/UserProgress');

// @desc    Get all units for a level
// @route   GET /api/units/level/:levelId
// @access  Private
exports.getUnitsByLevel = async (req, res) => {
  try {
    // FIXED: Changed 'levelId' to 'level' to match your database
    const units = await Unit.find({ level: req.params.levelId }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: units.length,
      units
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single unit with all content
// @route   GET /api/units/:unitId
// @access  Private
exports.getUnit = async (req, res) => {
  try {
    // FIXED: Changed 'levelId' to 'level'
    const unit = await Unit.findById(req.params.unitId).populate('level');

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    // Get user's progress for this unit
    let progress = await UserProgress.findOne({
      userId: req.user.id,
      unitId: unit._id
    });

    // If no progress exists, create initial progress entry
    if (!progress) {
      progress = await UserProgress.create({
        userId: req.user.id,
        // FIXED: Accessing 'unit.level._id' instead of 'unit.levelId._id'
        levelId: unit.level._id, 
        unitId: unit._id
      });
    }

    res.status(200).json({
      success: true,
      unit,
      progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create a new unit (Admin only)
// @route   POST /api/units
// @access  Private/Admin
exports.createUnit = async (req, res) => {
  try {
    const unit = await Unit.create(req.body);

    res.status(201).json({
      success: true,
      unit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update unit (Admin only)
// @route   PUT /api/units/:unitId
// @access  Private/Admin
exports.updateUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndUpdate(req.params.unitId, req.body, {
      new: true,
      runValidators: true
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    res.status(200).json({
      success: true,
      unit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete unit (Admin only)
// @route   DELETE /api/units/:unitId
// @access  Private/Admin
exports.deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndDelete(req.params.unitId);

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Unit deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};