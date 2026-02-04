const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  unitNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  // This is the link to the Level
  level: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true
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
  // Content: Sight Words
  sightWords: [{
    word: { type: String, required: true },
    audioUrl: String,
    imageUrl: String
  }],
  // Content: Decodable Words (Was missing!)
  decodableWords: [{
    word: String,
    imageUrl: String,
    audioUrl: String,
    phonemes: [String]
  }],
  // Content: Blending Tasks (Was missing!)
  blendingTasks: [{
    parts: [String],
    fullWord: String,
    audioUrl: String,
    imageUrl: String
  }],
  // Content: Segmenting Tasks (Was missing!)
  segmentingTasks: [{
    fullWord: String,
    segments: [String],
    audioUrl: String,
    imageUrl: String
  }],
  // Content: Sentences (Was missing!)
  sentences: [{
    text: String,
    audioUrl: String,
    wordsToHighlight: [String]
  }],
  // Settings
  isLocked: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    required: true
  },
  estimatedTime: {
    type: Number,
    default: 15 // in minutes
  },
  totalActivities: {
    type: Number,
    default: 5
  },
  badge: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Unit', unitSchema);