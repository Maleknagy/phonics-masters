const express = require('express');
const router = express.Router();
const {
  getLevels,
  getLevel,
  createLevel,
  updateLevel,
  deleteLevel
} = require('../controllers/levelController');

// This matches the functions we created in levelController.js

// Route: /api/levels
router.route('/')
  .get(getLevels)      // Get all levels
  .post(createLevel);  // Create a level (Admin)

// Route: /api/levels/:id
router.route('/:id')
  .get(getLevel)       // Get ONE level (and its units!)
  .put(updateLevel)    // Update level
  .delete(deleteLevel);// Delete level

module.exports = router;