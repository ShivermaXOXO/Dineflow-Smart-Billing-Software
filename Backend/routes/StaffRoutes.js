const express = require('express');
const router = express.Router();
const { registerStaff, getHotelStaff, updateStaff, deleteStaff } = require('../controllers/StaffController');
const { login } = require('../controllers/login');

router.post('/register', registerStaff); 
router.post('/login', login);     
router.get('/:hotelId', getHotelStaff);
router.put('/:id', updateStaff);
router.delete('/delete/:id', deleteStaff);


module.exports = router;
