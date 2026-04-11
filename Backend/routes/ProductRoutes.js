const express = require('express');
const router = express.Router();
const {
    getHotelProducts,
    addProduct,
    deleteProduct,
      updateProduct
} = require('../controllers/productController');

router.post('/add', addProduct);
router.get('/:hotelId', getHotelProducts);
router.delete('/:productId', deleteProduct); 
router.put('/:productId', updateProduct);

module.exports = router;
