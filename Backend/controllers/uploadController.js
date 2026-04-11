const path = require('path');

// Local file upload
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: 'No file uploaded' 
            });
        }

        // Construct the file URL
        const protocol = req.protocol;
        const host = req.get('host');
        const imageUrl = `${protocol}://${host}/uploads/images/${req.file.filename}`;
        
        res.json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: imageUrl,
            filename: req.file.filename,
            path: `/uploads/images/${req.file.filename}`
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to upload image' 
        });
    }
};

// Upload multiple images
const uploadMultipleImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No files uploaded' 
            });
        }

        const imageUrls = req.files.map(file => {
            const protocol = req.protocol;
            const host = req.get('host');
            return {
                url: `${protocol}://${host}/uploads/images/${file.filename}`,
                filename: file.filename,
                path: `/uploads/images/${file.filename}`
            };
        });
        
        res.json({
            success: true,
            message: `${req.files.length} image(s) uploaded successfully`,
            images: imageUrls
        });
    } catch (error) {
        console.error('Error uploading images:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to upload images' 
        });
    }
};

module.exports = {
    uploadImage,
    uploadMultipleImages
};