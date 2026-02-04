const mongoose = require('mongoose');
const Level = require('./models/Level');
const Unit = require('./models/Unit');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phonics_learning')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

async function seedDatabase() {
  try {
    // 1. Clear existing data
    await Level.deleteMany({});
    await Unit.deleteMany({});
    console.log('🗑️  Cleared old data...');

    // 2. Create Levels (1 through 8)
    const levelPromises = [
      {
        levelNumber: 1,
        title: "Phonics Adventure",
        description: "Learn basic phonics and sight words",
        theme: "forest",
        totalUnits: 5,
        order: 1,
        units: [] 
      },
      {
        levelNumber: 2,
        title: "Story Time",
        description: "Read short stories and understand context",
        theme: "forest",
        totalUnits: 5,
        order: 2,
        units: []
      },
      { levelNumber: 3, title: "Word Wizards", description: "Build and create new words", theme: "magic", totalUnits: 5, order: 3 },
      { levelNumber: 4, title: "Reading Rockets", description: "Launch into reading fluency", theme: "space", totalUnits: 5, order: 4 },
      { levelNumber: 5, title: "Grammar Galaxy", description: "Explore grammar and punctuation", theme: "space", totalUnits: 5, order: 5 },
      { levelNumber: 6, title: "Storytellers", description: "Write and tell your own stories", theme: "urban", totalUnits: 5, order: 6 },
      { levelNumber: 7, title: "Literacy Legends", description: "Master advanced reading skills", theme: "urban", totalUnits: 5, order: 7 },
      { levelNumber: 8, title: "Super Readers", description: "Become expert readers and writers", theme: "hero", totalUnits: 5, order: 8 }
    ].map(level => Level.create(level));

    const levelsCreated = await Promise.all(levelPromises);
    const level1 = levelsCreated[0]; // We will attach units to this specific Level document

    console.log('✅ Levels created...');

    // 3. Create Units for Level 1
    const unitPromises = [
      {
        unitNumber: 1,
        order: 1, 
        level: level1._id,
        title: "Sight Word Fun",
        description: "Basic sight words practice",
        activities: [
            {
                name: "Pop the Sight Words",
                title: "Pop the Sight Words",
                type: "SightWordPop",
                order: 1,
                isCompleted: false
            }
        ],
        sightWords: [
          { word: "an", audioUrl: "/audio/an.mp3" },
          { word: "a", audioUrl: "/audio/a.mp3" },
          { word: "the", audioUrl: "/audio/the.mp3" },
          { word: "is", audioUrl: "/audio/is.mp3" },
          { word: "and", audioUrl: "/audio/and.mp3" }
        ]
      },
      {
        unitNumber: 2,
        order: 2,
        level: level1._id,
        title: "Daily Vocabulary",
        description: "Common everyday words",
        activities: [
            {
                name: "Pop the Sight Words",
                title: "Pop the Sight Words",
                type: "SightWordPop",
                order: 1,
                isCompleted: false
            }
        ],
        sightWords: [
          { word: "see", audioUrl: "/audio/see.mp3" },
          { word: "sees", audioUrl: "/audio/sees.mp3" },
          { word: "are", audioUrl: "/audio/are.mp3" }
        ]
      },
      {
        unitNumber: 3,
        order: 3,
        level: level1._id,
        title: "People Words",
        description: "Words for everyone around us",
        activities: [
            {
                name: "Pop the Sight Words",
                title: "Pop the Sight Words",
                type: "SightWordPop",
                order: 1,
                isCompleted: false
            }
        ],
        sightWords: [
          { word: "he", audioUrl: "/audio/he.mp3" },
          { word: "your", audioUrl: "/audio/your.mp3" }
        ]
      },
      {
        unitNumber: 4,
        order: 4,
        level: level1._id,
        title: "Action Words",
        description: "Go go go!",
        activities: [
            {
                name: "Pop the Sight Words",
                title: "Pop the Sight Words",
                type: "SightWordPop",
                order: 1,
                isCompleted: false
            }
        ],
        sightWords: [
          { word: "with", audioUrl: "/audio/with.mp3" },
          { word: "what", audioUrl: "/audio/what.mp3" }
        ]
      },
      {
        unitNumber: 5,
        order: 5,
        level: level1._id,
        title: "Super Words",
        description: "Advanced words for Unit 5!",
        activities: [
            {
                name: "Pop the Sight Words",
                title: "Pop the Sight Words",
                type: "SightWordPop",
                order: 1,
                isCompleted: false
            }
        ],
        sightWords: [
          { word: "his", audioUrl: "/audio/his.mp3" },
          { word: "her", audioUrl: "/audio/her.mp3" }
        ]
      }
    ].map(unit => Unit.create(unit));

    // Wait for units to be created
    const createdUnits = await Promise.all(unitPromises);
    console.log('✅ Units created...');

    // 4. Link Units back to Level 1
    level1.units = createdUnits.map(unit => unit._id);
    await level1.save();
    console.log('🔗 Linked Units to Level 1 successfully...');

    console.log('🚀 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();