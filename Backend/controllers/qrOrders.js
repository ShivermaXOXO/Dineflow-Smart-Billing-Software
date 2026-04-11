const QROrders = require('../models/qrOrders');
// Place QR Order
const placeQROrder = async (req, res) => {
  const {tableNumber, items, hotelId, total, sessionId } = req.body;

  try {
    const order = await QROrders.create({
      order_id: `ORD-${Date.now()}`,
      table_number: tableNumber,
      session_id: sessionId,
      items,
      hotel_id: hotelId,
      total,
      status: 'pending'
    });

    // Emit new QR order via socket
    if (global.io) global.io.to(`hotel-${hotelId}`).emit('newQROrder', order);

    res.status(201).json({ message: 'QR order placed successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place QR order' });
  }
};

const getAllQROrders = async (req, res) => {

  const { hotelId } = req.params;
 
  const orders = await QROrders.findAll({
    where: {
      hotel_id: hotelId,
    },
    order: [["created_at", "DESC"]],
  });

  res.json({ orders });
};

const getQROrders = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { sessionId } = req.query; // ✅ get sessionId from query

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const orders = await QROrders.findAll({
      where: {
        hotel_id: hotelId,
        session_id: sessionId,
      },
      order: [["created_at", "DESC"]],
    });

    res.json({ orders });
  } catch (err) {
    console.error("Error fetching orders QR :", err.message);
    res.status(500).json({ error: "Failed to fetch QR orders" });
  }
};



const updateQROrderStatus = async (req, res) => {
  const { orderId } = req.params;

  try {
  
    const order = await QROrders.findOne({ where: { order_id: orderId } });
   
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
   
    order.status = "completed";
    await order.save();
 
    res.json({ message: "Order updated", order });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
};


module.exports = { placeQROrder, getQROrders, getAllQROrders, updateQROrderStatus };
