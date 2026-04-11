const Staff = require('../models/Staff')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const path = require('path')
const Hotel = require('../models/Hotels')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

const login = async (req, res) => {
    const { email, password, role, hotelId } = req.body;

    try {
        // Find hotel by ID (using the id column from your database)
        const hotel = await Hotel.findByPk(hotelId);
        
        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        // Check if hotel login is restricted
        if (hotel.status === 'restricted') {
            return res.status(403).json({ 
                message: 'Login disabled. This hotel account has been restricted. Please contact support.' 
            });
        }

        // Find user with the hotel ID
        console.log("table check running");
        const user = await Staff.findOne({ 
            where: { 
                email, 
                role, 
                hotelId: Number(hotelId) 
            } 
        });
        console.log(user);

        if (!user) return res.status(404).json({ message: 'User not found for this hotel' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

        const token = jwt.sign(
            { id: user.id, hotelId: user.hotelId, role: user.role },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                hotelId: user.hotelId
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login error' });
    }
}

module.exports = { login }