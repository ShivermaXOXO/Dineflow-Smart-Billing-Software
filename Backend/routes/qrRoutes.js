const express = require("express");
const router = express.Router();
const { generateTableQR } = require("../controllers/qrController");
console.log("Setting up QR route");
router.get("/qr/:hotelId/:tableNumber", generateTableQR);

module.exports = router;
