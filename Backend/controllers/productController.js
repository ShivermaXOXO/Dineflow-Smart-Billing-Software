const Product = require('../models/Product');

const addProduct = async (req, res) => {
    const { name, price, type, hotelId, image } = req.body;
    try {
        const product = await Product.create({ name, price, type, hotelId, imageUrl: image });
        res.status(201).json({ message: "Product added", product });
    } catch (err) {
        console.log("Adding product failed: ", err);
        return res.status(500).json({ error: 'Error occurred' });
    }
};

const getHotelProducts = async (req, res) => {
    const { hotelId } = req.params;
    
    try {
        // Validate hotelId
        if (!hotelId || isNaN(hotelId)) {
            return res.status(400).json({ error: "Invalid hotel ID" });
        }

        const products = await Product.findAll({ 
            where: { 
                hotelId: parseInt(hotelId) 
            },
            order: [['createdAt', 'DESC']] // Optional: order by creation date
        });
        
        res.status(200).json(products);
    } catch (err) {
        console.error("❌ getHotelProducts FULL ERROR:", err.message);
        console.error(err);
        res.status(500).json({ error: err.message });
    }

};

const deleteProduct = async (req, res) => {
    const { productId } = req.params;
    try {
        const deleted = await Product.destroy({ where: { id: productId } });
        if (deleted) {
            res.status(200).json({ message: "Product deleted successfully" });
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to delete product", err });
    }
};
const updateProduct = async (req, res) => {

    try {

        const { name, price, type, image } = req.body;  // imageUrl as string
        const { productId } = req.params;

        const updated = await Product.update(
            { name, price, type, imageUrl: image},
            { where: { id: productId } }
        );

        if (!updated[0]) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({ message: "Product updated successfully" });

    } catch (err) {
        console.log("Update failed:", err);
        res.status(500).json({ error: "Update failed", err });
    }
};

module.exports = {
    getHotelProducts,
    addProduct,
    deleteProduct,
    updateProduct
};