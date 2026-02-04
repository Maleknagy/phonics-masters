require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const Level = require('./models/Level');
const Unit = require('./models/Unit');

const checkData = async () => {
  try {
    await connectDB();
    console.log('-----------------------------------');
    console.log('🔍 DIAGNOSTIC REPORT');
    console.log('-----------------------------------');

    // 1. Check Levels
    const levels = await Level.find({});
    console.log(`📊 Total Levels Found: ${levels.length}`);
    if (levels.length > 0) {
      console.log(`   First Level ID: ${levels[0]._id}`);
      console.log(`   First Level Name: ${levels[0].title}`);
    }

    // 2. Check Units
    const units = await Unit.find({});
    console.log(`📊 Total Units Found: ${units.length}`);
    
    if (units.length > 0) {
      console.log(`   First Unit Title: ${units[0].title}`);
      console.log(`   First Unit belongs to Level: ${units[0].level}`);
      
      // 3. Test the connection between them
      if (levels.length > 0) {
        // Look for units belonging to the first level
        const matchedUnits = await Unit.find({ level: levels[0]._id });
        console.log(`🔗 Units linked to Level 1: ${matchedUnits.length}`);
      }
    } else {
      console.log('⚠️  WARNING: No units found! The seed script did not work.');
    }

    console.log('-----------------------------------');
    process.exit();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkData();