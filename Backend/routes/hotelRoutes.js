const express = require('express');
const router = express.Router();
const {getHotel, setTableNumber, getActiveHotels, addHotel, deleteHotel, getHotelById, checkHotel, updateHotel, toggleHotelStatus} = require('../controllers/hotelController')
// set / update table number
router.put('/set-table', setTableNumber);

router.get('/',getHotel);
router.get('/active', getActiveHotels);
router.post('/',addHotel);
router.get('/:id', getHotelById);
router.get('/:id/check', checkHotel);
router.put('/:hotelId/toggle-status', toggleHotelStatus); // More specific route first
router.put('/:hotelId', updateHotel); // General update route second
router.delete('/:hotelId', deleteHotel);

module.exports = router;