const express = require('express');
const router = express.Router();
const verifySuperAdmin = require('../middlewares/authMiddleware');
const {getHotel, setTableNumber, getActiveHotels, addHotel, deleteHotel, getHotelById, checkHotel, updateHotel, toggleHotelStatus} = require('../controllers/hotelController')
// set / update table number
router.put('/set-table', setTableNumber);

router.get('/', verifySuperAdmin, getHotel);
router.get('/active', verifySuperAdmin, getActiveHotels);
router.post('/', verifySuperAdmin, addHotel);
router.get('/:id', getHotelById);
router.get('/:id/check', verifySuperAdmin, checkHotel);
router.put('/:hotelId/toggle-status', verifySuperAdmin, toggleHotelStatus); // More specific route first
router.put('/:hotelId', verifySuperAdmin, updateHotel); // General update route second
router.delete('/:hotelId', verifySuperAdmin, deleteHotel);

module.exports = router;