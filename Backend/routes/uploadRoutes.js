const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadImage, uploadMultipleImages } = require('../controllers/uploadController');

// Upload single image
router.post('/', upload.single('image'), uploadImage);

// Upload multiple images
router.post('/multiple', upload.array('images', 10), uploadMultipleImages); // Max 10 images

// Test route
router.get('/test', (req, res) => {
    res.json({ 
        success: true,
        message: 'Upload route is working' 
    });
});

module.exports = router;