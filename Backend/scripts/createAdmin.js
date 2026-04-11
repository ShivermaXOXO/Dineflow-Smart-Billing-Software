require('dotenv').config();
const bcrypt = require('bcrypt');
const Staff = require('../models/Staff');

(async () => {
  const hashed = await bcrypt.hash('admin123', 10);

  await Staff.create({
    name: 'Demo Admin',
    email: 'admin@test.com',
    password: hashed,
    role: 'admin',
    hotelId: 6755
  });

  console.log('✅ Demo admin created');
  process.exit();
})();
