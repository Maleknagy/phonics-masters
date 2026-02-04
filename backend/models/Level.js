const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
  levelNumber: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 8
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  theme: {
    type: String,
    default: 'default' // e.g., 'ocean', 'space', 'jungle'
  },
  icon: {
    type: String,
    default: 'level-icon.png'
  },
  backgroundColor: {
    type: String,
    default: '#6366f1' // Tailwind indigo-500
  },
  isLocked: {
    type: Boolean,
    default: true
  },
  requiredStars: {
    type: Number,
    default: 0 // Stars needed to unlock this level
  },
  isPremium: {
    type: Boolean,
    default: false // Mark if this level requires premium subscription
  },
  totalUnits: {
    type: Number,
    default: 5
  },
  order: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Level', levelSchema);
