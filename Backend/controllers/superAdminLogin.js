// controllers/superAdminLogin.js
const jwt = require('jsonwebtoken');

const login = (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.SUPERADMIN_EMAIL &&
    password === process.env.SUPERADMIN_PASS
  ) {
    const token = jwt.sign(
      { role: 'superadmin' },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1d' }
    );

    return res.json({
      message: "Login successful",
      token,
      role: "superadmin"
    });
  }

  res.status(401).json({ message: "Invalid credentials" });
};

module.exports = login;