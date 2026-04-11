const express = require('express');
const router = express.Router();
const {
  createOrder,
  getHotelOrders,
  acceptOrder,
  updateOrderStatus,
  getOrderById,
  cancelOrder,
  updateOrder,
  deleteOrder,
  deleteOrdersByTimestamp,
  checkCustomer
} = require('../controllers/orderController');

// Create new order
router.post('/', createOrder);

//checks customer info
router.get('/check', checkCustomer);

// Get all orders for a hotel
router.get('/hotel/:hotelId', getHotelOrders);

// Get single order by ID
router.get('/:id', getOrderById);

// Update entire order
router.put('/:id', updateOrder);

// Accept order (assign to staff)
router.put('/:id/accept', acceptOrder);

// Update order status
router.put('/:id/status', updateOrderStatus);

// Cancel order
router.put('/:id/cancel', cancelOrder);

// Delete order
router.delete('/delete-by-timestamp', deleteOrdersByTimestamp);
router.delete('/:id', deleteOrder);



module.exports = router;
