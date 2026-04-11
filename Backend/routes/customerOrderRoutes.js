const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getHotelOrders,
  updateOrder,
  finalizeOrder,
  callStaffForHelp,
  updateOrderStatus,
  getOrderById,
} = require('../controllers/customerOrderController');

router.post('/', placeOrder); // Place order
router.get('/single/:id', getOrderById); // Get single order by ID
router.get('/:hotelId', getHotelOrders); // View live orders
router.put('/:id', updateOrder); // Staff update
router.put('/finalize/:id', finalizeOrder); // Finalize order
router.post('/call-staff', callStaffForHelp); // Call staff for help
router.put('/:id/status', updateOrderStatus); // Update order status

module.exports = router;
