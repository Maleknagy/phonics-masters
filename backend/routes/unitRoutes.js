const express = require('express');
const router = express.Router();
const {
  getUnitsByLevel,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit
} = require('../controllers/unitController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
  .post(authorize('admin'), createUnit);

router.route('/level/:levelId')
  .get(getUnitsByLevel);

router.route('/:unitId')
  .get(getUnit)
  .put(authorize('admin'), updateUnit)
  .delete(authorize('admin'), deleteUnit);

module.exports = router;
