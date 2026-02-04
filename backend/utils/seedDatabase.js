require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Level = require('../models/Level');
const Unit = require('../models/Unit');

// Sample data for seeding
const levelsData = [
  {
    levelNumber: 1,
    title: 'Ocean Adventure',
    description: 'Begin your phonics journey underwater!',
    theme: 'ocean',
    icon: '/assets/levels/ocean-icon.png',
    backgroundColor: '#3b82f6',
    isLocked: false,
    requiredStars: 0,
    isPremium: false,
    totalUnits: 5,
    order: 1
  },
  {
    levelNumber: 2,
    title: 'Space Explorer',
    description: 'Blast off to learn among the stars!',
    theme: 'space',
    icon: '/assets/levels/space-icon.png',
    backgroundColor: '#8b5cf6',
    isLocked: true,
    requiredStars: 15,
    isPremium: false,
    totalUnits: 5,
    order: 2
  },
  {
    levelNumber: 3,
    title: 'Jungle Quest',
    description: 'Discover words in the wild jungle!',
    theme: 'jungle',
    icon: '/assets/levels/jungle-icon.png',
    backgroundColor: '#10b981',
    isLocked: true,
    requiredStars: 30,
    isPremium: false,
    totalUnits: 5,
    order: 3
  }
];

const unitsData = [
  // Level 1 - Ocean Adventure
  {
    levelNumber: 1,
    unitNumber: 1,
    title: 'Meet the Sea Friends',
    description: 'Learn basic sight words with ocean creatures',
    sightWords: [
      { word: 'the', audioUrl: '/assets/audio/the.mp3' },
      { word: 'and', audioUrl: '/assets/audio/and.mp3' },
      { word: 'is', audioUrl: '/assets/audio/is.mp3' },
      { word: 'to', audioUrl: '/assets/audio/to.mp3' }
    ],
    decodableWords: [
      {
        word: 'cat',
        imageUrl: '/assets/images/cat.png',
        audioUrl: '/assets/audio/cat.mp3',
        phonemes: ['c', 'a', 't']
      },
      {
        word: 'dog',
        imageUrl: '/assets/images/dog.png',
        audioUrl: '/assets/audio/dog.mp3',
        phonemes: ['d', 'o', 'g']
      },
      {
        word: 'sun',
        imageUrl: '/assets/images/sun.png',
        audioUrl: '/assets/audio/sun.mp3',
        phonemes: ['s', 'u', 'n']
      }
    ],
    blendingTasks: [
      {
        parts: ['sun', 'set'],
        fullWord: 'sunset',
        audioUrl: '/assets/audio/sunset.mp3',
        imageUrl: '/assets/images/sunset.png'
      }
    ],
    segmentingTasks: [
      {
        fullWord: 'happy',
        segments: ['hap', 'py'],
        audioUrl: '/assets/audio/happy.mp3',
        imageUrl: '/assets/images/happy.png'
      }
    ],
    sentences: [
      {
        text: 'The cat is happy.',
        audioUrl: '/assets/audio/sentence1.mp3',
        wordsToHighlight: ['the', 'cat', 'is']
      }
    ],
    order: 1,
    isLocked: false,
    isPremium: false,
    estimatedTime: 15,
    totalActivities: 5,
    badge: '/assets/badges/ocean-1.png'
  },
  {
    levelNumber: 1,
    unitNumber: 2,
    title: 'Coral Reef Sounds',
    description: 'Practice blending sounds together',
    sightWords: [
      { word: 'a', audioUrl: '/assets/audio/a.mp3' },
      { word: 'I', audioUrl: '/assets/audio/i.mp3' },
      { word: 'he', audioUrl: '/assets/audio/he.mp3' },
      { word: 'she', audioUrl: '/assets/audio/she.mp3' }
    ],
    decodableWords: [
      {
        word: 'fish',
        imageUrl: '/assets/images/fish.png',
        audioUrl: '/assets/audio/fish.mp3',
        phonemes: ['f', 'i', 'sh']
      },
      {
        word: 'ship',
        imageUrl: '/assets/images/ship.png',
        audioUrl: '/assets/audio/ship.mp3',
        phonemes: ['sh', 'i', 'p']
      }
    ],
    blendingTasks: [
      {
        parts: ['star', 'fish'],
        fullWord: 'starfish',
        audioUrl: '/assets/audio/starfish.mp3',
        imageUrl: '/assets/images/starfish.png'
      }
    ],
    segmentingTasks: [
      {
        fullWord: 'sunset',
        segments: ['sun', 'set'],
        audioUrl: '/assets/audio/sunset.mp3',
        imageUrl: '/assets/images/sunset.png'
      }
    ],
    sentences: [
      {
        text: 'I see a big fish.',
        audioUrl: '/assets/audio/sentence2.mp3',
        wordsToHighlight: ['I', 'see', 'a', 'fish']
      }
    ],
    order: 2,
    isLocked: true,
    isPremium: false,
    estimatedTime: 15,
    totalActivities: 5,
    badge: '/assets/badges/ocean-2.png'
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    await Level.deleteMany({});
    await Unit.deleteMany({});

    console.log('🌱 Seeding levels...');
    const levels = await Level.insertMany(levelsData);
    console.log(`✅ ${levels.length} levels created`);

    console.log('🌱 Seeding units...');
    
    // Match units to their level IDs
    for (const unitData of unitsData) {
      const level = levels.find(l => l.levelNumber === unitData.levelNumber);
      if (level) {
        const { levelNumber, ...unitWithoutLevelNumber } = unitData;
        await Unit.create({
          ...unitWithoutLevelNumber,
          level: level._id  // CHANGED: 'levelId' -> 'level' to match Mongoose schema
        });
      }
    }

    const unitCount = await Unit.countDocuments();
    console.log(`✅ ${unitCount} units created`);

    console.log('✨ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();