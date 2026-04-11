require('dotenv').config();
const bcrypt = require('bcrypt');
const Staff = require('../models/Staff');

(async () => {
  try {
    const hashed = await bcrypt.hash('counter123', 10);
    const existing = await Staff.findOne({
      where: { email: 'counter@test.com' }
    });

    if (existing) {
      console.log('⚠️ Counter already exists');
      process.exit();
    }
  await Staff.create({
    name: 'Rohit Counter',
    email: 'counter@test.com',
    password: hashed,
    role: 'counter',
    hotelId: 6755   
  });

  console.log('Counter user created successfully');
  process.exit();

  } catch (err) {
    console.error('❌ Error creating counter:', err.message);
    process.exit();
  }
})();
