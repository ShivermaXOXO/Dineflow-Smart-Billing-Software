// routes/repeatCustomerRoutes.js
const express = require('express');
const router = express.Router();
const {
  getRepeatCustomers,
  updateRepeatCustomers,
  sendWhatsAppMessage,
  deleteRepeatCustomer
} = require('../controllers/repeatCustomerController');

// Get all repeat customers for a hotel
router.get('/hotel/:hotelId', getRepeatCustomers);

// Update/identify repeat customers for a hotel
router.post('/hotel/:hotelId/update', updateRepeatCustomers);

// Send WhatsApp message to customers
router.post('/whatsapp/send', sendWhatsAppMessage);

// Delete/deactivate a repeat customer
router.delete('/:id', deleteRepeatCustomer);

module.exports = router;
