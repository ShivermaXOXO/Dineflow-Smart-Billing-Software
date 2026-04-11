const QRCode = require("qrcode");

exports.generateTableQR = async (req, res) => {
 
  try {
    const { hotelId, tableNumber } = req.params;

    const url = `https://yourdomain.com/c/${hotelId}/${tableNumber}`;

    const qrImage = await QRCode.toDataURL(url);

    res.json({
      success: true,
      tableNumber,
      qrImage, // base64 image
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
