const express = require('express');
const router = express.Router();
const { placeQROrder, getQROrders, updateQROrderStatus, getAllQROrders } = require('../controllers/qrOrders');

// Place QR order
router.post('/create', placeQROrder);

// Get QR orders for a hotel
router.get('/all/:hotelId', getAllQROrders);
router.get('/:hotelId', getQROrders);
router.put("/update/:orderId", updateQROrderStatus);


module.exports = router;
