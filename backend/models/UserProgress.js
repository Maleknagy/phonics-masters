const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  levelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  
  // Activity Completion Tracking
  activitiesCompleted: {
    sightWordPop: {
      completed: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
      attempts: { type: Number, default: 0 },
      stars: { type: Number, min: 0, max: 3, default: 0 }
    },
    phonicsBuilder: {
      completed: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
      attempts: { type: Number, default: 0 },
      stars: { type: Number, min: 0, max: 3, default: 0 }
    },
    dictationStation: {
      completed: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
      attempts: { type: Number, default: 0 },
      stars: { type: Number, min: 0, max: 3, default: 0 }
    },
    syllableNinja: {
      completed: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
      attempts: { type: Number, default: 0 },
      stars: { type: Number, min: 0, max: 3, default: 0 }
    },
    karaokeReader: {
      completed: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
      attempts: { type: Number, default: 0 },
      stars: { type: Number, min: 0, max: 3, default: 0 }
    }
  },
  
  // Overall Progress
  isCompleted: {
    type: Boolean,
    default: false
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  totalScore: {
    type: Number,
    default: 0
  },
  totalStars: {
    type: Number,
    default: 0
  },
  
  // Time Tracking
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  lastActivityDate: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index to ensure unique progress per user per unit
userProgressSchema.index({ userId: 1, unitId: 1 }, { unique: true });

// Calculate completion percentage before saving
userProgressSchema.pre('save', function(next) {
  const activities = this.activitiesCompleted;
  const completedCount = Object.values(activities).filter(a => a.completed).length;
  const totalActivities = Object.keys(activities).length;
  
  this.completionPercentage = Math.round((completedCount / totalActivities) * 100);
  this.isCompleted = this.completionPercentage === 100;
  
  // Calculate total stars
  this.totalStars = Object.values(activities).reduce((sum, a) => sum + a.stars, 0);
  
  // Set completion date if just completed
  if (this.isCompleted && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

module.exports = mongoose.model('UserProgress', userProgressSchema);
