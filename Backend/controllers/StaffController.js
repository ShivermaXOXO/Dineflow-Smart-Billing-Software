const Staff = require('../models/Staff');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const registerStaff = async (req, res) => {
  const { name, email, password, role, hotelId } = req.body;
 
  try {
    const existing = await Staff.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await Staff.create({
      name,
      email,
      password: hashedPassword,
      role,
      hotelId
    });

    res.status(201).json({ message: 'Staff registered', staff: newStaff });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Staff registration failed' });
  }
};

const getHotelStaff = async (req, res) => {
  const { hotelId } = req.params;
  try {
    const staff = await Staff.findAll({ where: { hotelId } });
    res.status(200).json(staff);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
};

const updateStaff = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;

  try {
    const staff = await Staff.findByPk(id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    if (name) staff.name = name;
    if (email) staff.email = email;
    if (role) staff.role = role;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      staff.password = hashedPassword;
    }

    await staff.save();
    res.status(200).json({ message: 'Staff updated', staff });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update staff' });
  }
};
const deleteStaff = async (req, res) => {
  const { id } = req.params;

  try {
    const staff = await Staff.findByPk(id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    await staff.destroy();
    res.status(200).json({ message: 'Staff deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete staff' });
  }
};



module.exports = { registerStaff, getHotelStaff, updateStaff, deleteStaff };