const mongoose = require('mongoose');
const Level = require('./models/Level');
const Unit = require('./models/Unit');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phonics_learning', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

async function seedDatabase() {
  try {
    // Clear existing data
    await Level.deleteMany({});
    await Unit.deleteMany({});

    // Create Levels
    const levelPromises = [
      {
        levelNumber: 1,
        title: "Phonics Adventure",
        description: "Learn basic phonics and sight words",
        theme: "forest",
        totalUnits: 5,
        order: 1
      },
      {
        levelNumber: 2,
        title: "Story Time",
        description: "Read short stories and understand context",
        theme: "forest",
        totalUnits: 5,
        order: 2
      },
      {
        levelNumber: 3,
        title: "Word Wizards",
        description: "Build and create new words",
        theme: "magic",
        totalUnits: 5,
        order: 3
      },
      {
        levelNumber: 4,
        title: "Reading Rockets",
        description: "Launch into reading fluency",
        theme: "space",
        totalUnits: 5,
        order: 4
      },
      {
        levelNumber: 5,
        title: "Grammar Galaxy",
        description: "Explore grammar and punctuation",
        theme: "space",
        totalUnits: 5,
        order: 5
      },
      {
        levelNumber: 6,
        title: "Storytellers",
        description: "Write and tell your own stories",
        theme: "urban",
        totalUnits: 5,
        order: 6
      },
      {
        levelNumber: 7,
        title: "Literacy Legends",
        description: "Master advanced reading skills",
        theme: "urban",
        totalUnits: 5,
        order: 7
      },
      {
        levelNumber: 8,
        title: "Super Readers",
        description: "Become expert readers and writers",
        theme: "hero",
        totalUnits: 5,
        order: 8
      }
    ].map(level => Level.create(level));

    const levelsCreated = await Promise.all(levelPromises);
    const level1 = levelsCreated[0];

    // Create Units for Level 1
    const unitPromises = [
      {
        unitNumber: 1,
        level: level1._id,
        title: "Sight Word Fun",
        description: "Basic sight words practice",
        activities: ["SightWordPop"],
        sightWords: [
          { word: "an", audioUrl: "/audio/an.mp3" },
          { word: "a", audioUrl: "/audio/a.mp3" },
          { word: "the", audioUrl: "/audio/the.mp3" },
          { word: "is", audioUrl: "/audio/is.mp3" },
          { word: "and", audioUrl: "/audio/and.mp3" },
          { word: "has", audioUrl: "/audio/has.mp3" },
          { word: "have", audioUrl: "/audio/have.mp3" },
          { word: "on", audioUrl: "/audio/on.mp3" },
          { word: "in", audioUrl: "/audio/in.mp3" },
          { word: "it", audioUrl: "/audio/it.mp3" }
        ]
      },
      {
        unitNumber: 2,
        level: level1._id,
        title: "Daily Vocabulary",
        description: "Common everyday words",
        activities: ["SightWordPop"],
        sightWords: [
          { word: "see", audioUrl: "/audio/see.mp3" },
          { word: "sees", audioUrl: "/audio/sees.mp3" },
          { word: "are", audioUrl: "/audio/are.mp3" },
          { word: "my", audioUrl: "/audio/my.mp3" },
          { word: "I", audioUrl: "/audio/I.mp3" },
          { word: "that", audioUrl: "/audio/that.mp3" },
          { word: "want", audioUrl: "/audio/want.mp3" },
          { word: "like", audioUrl: "/audio/like.mp3" },
          { word: "this", audioUrl: "/audio/this.mp3" },
          { word: "you", audioUrl: "/audio/you.mp3" }
        ]
      },
      {
        unitNumber: 3,
        level: level1._id,
        title: "People Words",
        description: "Words for everyone around us",
        activities: ["SightWordPop"],
        sightWords: [
          { word: "he", audioUrl: "/audio/he.mp3" },
          { word: "your", audioUrl: "/audio/your.mp3" },
          { word: "do", audioUrl: "/audio/do.mp3" },
          { word: "she", audioUrl: "/audio/she.mp3" },
          { word: "don't", audioUrl: "/audio/dont.mp3" },
          { word: "yes", audioUrl: "/audio/yes.mp3" },
          { word: "me", audioUrl: "/audio/me.mp3" },
          { word: "am", audioUrl: "/audio/am.mp3" },
          { word: "big", audioUrl: "/audio/big.mp3" },
          { word: "small", audioUrl: "/audio/small.mp3" }
        ]
      },
      {
        unitNumber: 4,
        level: level1._id,
        title: "Action Words",
        description: "Go go go!",
        activities: ["SightWordPop"],
        sightWords: [
          { word: "with", audioUrl: "/audio/with.mp3" },
          { word: "what", audioUrl: "/audio/what.mp3" },
          { word: "to", audioUrl: "/audio/to.mp3" },
          { word: "for", audioUrl: "/audio/for.mp3" },
          { word: "at", audioUrl: "/audio/at.mp3" },
          { word: "can", audioUrl: "/audio/can.mp3" },
          { word: "now", audioUrl: "/audio/now.mp3" },
          { word: "no", audioUrl: "/audio/no.mp3" },
          { word: "we", audioUrl: "/audio/we.mp3" },
          { word: "go", audioUrl: "/audio/go.mp3" }
        ]
      },
      {
        unitNumber: 5,
        level: level1._id,
        title: "Super Words",
        description: "Advanced words for Unit 5!",
        activities: ["SightWordPop"],
        sightWords: [
          { word: "his", audioUrl: "/audio/his.mp3" },
          { word: "her", audioUrl: "/audio/her.mp3" },
          { word: "they", audioUrl: "/audio/they.mp3" },
          { word: "some", audioUrl: "/audio/some.mp3" },
          { word: "under", audioUrl: "/audio/under.mp3" },
          { word: "doesn't", audioUrl: "/audio/doesnt.mp3" },
          { word: "put", audioUrl: "/audio/put.mp3" },
          { word: "puts", audioUrl: "/audio/puts.mp3" },
          { word: "get", audioUrl: "/audio/get.mp3" },
          { word: "gets", audioUrl: "/audio/gets.mp3" }
        ]
      }
    ].map(unit => Unit.create(unit));

    await Promise.all(unitPromises);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
