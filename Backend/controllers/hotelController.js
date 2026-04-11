const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Hotel = require('../models/Hotels');
const Staff = require('../models/Staff');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
// Get all hotels
const getHotel = async (req, res) => {
  try {
    const hotels = await Hotel.findAll();
    res.status(200).json(hotels);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
};
function generateUUID() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
// Get active hotels only (for homepage display)
const getActiveHotels = async (req, res) => {
  try {
    const hotels = await Hotel.findAll({
      where: { status: 'active' }
    });
    res.status(200).json(hotels);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active hotels' });
  }
};

// Get hotel by ID
const getHotelById = async (req, res) => {
  const { id } = req.params;

  try {
    const hotel = await Hotel.findByPk(id);

    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    return res.status(200).json({
      id: hotel.id,
      name: hotel.name,
      status: hotel.status,
      tablenumber: hotel.tablenumber
    });

  } catch (err) {
    console.error("getHotelById error:", err);
    res.status(500).json({ error: 'Failed to fetch hotel' });
  }
};

// Set / Update table number
const setTableNumber = async (req, res) => {
  try {
    const { hotelId, tablenumber } = req.body;

    if (!hotelId || !tablenumber) {
      return res.status(400).json({
        message: 'hotelId and tablenumber are required'
      });
    }

    const hotel = await Hotel.findByPk(hotelId);

    if (!hotel) {
      return res.status(404).json({
        message: 'Hotel not found'
      });
    }

    hotel.tablenumber = tablenumber;
    await hotel.save();

    res.status(200).json({
      message: 'Table number updated successfully',
      tablenumber: hotel.tablenumber
    });
  } catch (err) {
    console.error('Error setting table number:', err);
    res.status(500).json({
      message: 'Failed to update table number'
    });
  }
};

// check uuid hotel exists and its status

const checkHotel = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const hotel = await Hotel.findByPk(id);

    if (!hotel) {
      return res.json({
        exists: false,
        message: "Hotel not found"
      });
    }

    return res.json({
      exists: true,
      status: hotel.status,
      name: hotel.name,
      tablenumber: hotel.tablenumber
    });

  } catch (error) {
    console.error("checkHotel error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Add a hotel
const addHotel = async (req, res) => {
  const { name, address, profileImage, email, password } = req.body;

  try {
    // Check if hotel already exists
    const existingHotel = await Hotel.findOne({ where: { email } });
    if (existingHotel) {
      return res.status(400).json({ message: 'Hotel with this email already exists' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Generate unique UUID
    let id = generateUUID();
    let exists = await Hotel.findOne({ where: { id } });
    
    
    while (exists) {
      id = generateUUID();
      exists = await Hotel.findOne({ where: { id } });
    
    }
 

    // Create new hotel
    const hotel = await Hotel.create({
      name,
      address,
      profileImage,
      email,
      password: hashedPassword,
      id,
    });

    // Create admin staff member for the hotel with the same UUID
    await Staff.create({
      name: `${name} Admin`,
      email: email,
      password: hashedPassword,
      role: 'admin',
      hotelId: id // Use UUID as foreign key
    });

    // Generate JWT token
    const token = jwt.sign({ id: hotel.id, email: hotel.email }, process.env.JWT_SECRET_KEY, {
      expiresIn: '24h',
    });

    res.status(201).json({
      message: 'Hotel created successfully with admin account',
      hotel,
      id,
      token,
    });
  } catch (err) {
    console.error('Error creating hotel:', err);
    res.status(500).json({ error: 'Failed to add hotel', details: err.message });
  }
};


const deleteHotel = async (req, res) => {
  const { hotelId } = req.params;
  try {
    const deleted = await Hotel.destroy({ where: { id: hotelId } });
    if (deleted) {
      return res.status(200).json({ message: 'Hotel deleted successfully' });
    } else {
      return res.status(404).json({ message: 'Hotel not found' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Deletion failed', err });
  }
};

// Update hotel details
const updateHotel = async (req, res) => {
  const { hotelId } = req.params;
  const { name, address, profileImage, email } = req.body;


  try {
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) { 
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== hotel.email) {
      const existingHotel = await Hotel.findOne({ where: { email } });
      if (existingHotel) {
        return res.status(400).json({ message: 'Hotel with this email already exists' });
      }
    }

    // Update hotel fields
    if (name) hotel.name = name;
    if (address) hotel.address = address;
    if (profileImage) hotel.profileImage = profileImage;
    if (email) hotel.email = email;

    await hotel.save();
    res.status(200).json({
      message: 'Hotel updated successfully',
      hotel
    });
  } catch (err) {
    console.error('Error updating hotel:', err);
    res.status(500).json({ error: 'Failed to update hotel', details: err.message });
  }
};

// Toggle hotel login access (restrict/allow)
const toggleHotelStatus = async (req, res) => {
  const { hotelId } = req.params;
  try {
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Toggle between 'allowed' and 'restricted'
    const newStatus = hotel.status === 'allowed' ? 'restricted' : 'allowed';
    await hotel.update({ status: newStatus });

    res.status(200).json({ 
      message: `Hotel login access ${newStatus === 'allowed' ? 'allowed' : 'restricted'} successfully`,
      hotel 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to toggle hotel login access', err });
  }
};

module.exports = { getHotel, setTableNumber,getActiveHotels, addHotel, deleteHotel, getHotelById, checkHotel, updateHotel, toggleHotelStatus };
