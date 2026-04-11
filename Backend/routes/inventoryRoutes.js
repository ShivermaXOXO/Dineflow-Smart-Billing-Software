const express = require('express');
const router = express.Router();
const {
  createInventoryItem,
  getInventoryByHotel,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryAnalytics,
  updateStockLevel
} = require('../controllers/inventoryController');

// CRUD Operations
router.post('/create', createInventoryItem);
router.get('/:hotelId', getInventoryByHotel);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);

// Analytics and Reports
router.get('/analytics/:hotelId', getInventoryAnalytics);

// Stock Management
router.patch('/stock/:id', updateStockLevel);

module.exports = router;
