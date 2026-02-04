const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't return password by default
  },
  childName: {
    type: String,
    required: [true, 'Please provide the child\'s name'],
    trim: true
  },
  age: {
    type: Number,
    min: 4,
    max: 12
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  subscriptionStatus: {
    type: String,
    enum: ['free', 'premium', 'trial'],
    default: 'free'
  },
  subscriptionExpiry: {
    type: Date,
    default: null
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  currentLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 8
  },
  currentUnit: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  totalStars: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update isPremium based on subscription status
userSchema.pre('save', function(next) {
  if (this.subscriptionStatus === 'premium' || this.subscriptionStatus === 'trial') {
    if (this.subscriptionExpiry && this.subscriptionExpiry > new Date()) {
      this.isPremium = true;
    } else {
      this.isPremium = false;
      this.subscriptionStatus = 'free';
    }
  } else {
    this.isPremium = false;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
