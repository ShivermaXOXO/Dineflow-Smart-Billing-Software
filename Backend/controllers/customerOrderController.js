const CustomerOrder = require('../models/CustomerOrder');
const Product = require('../models/Product');
const { Op } = require('sequelize');

// Place new customer order
const placeOrder = async (req, res) => {
  const { customername, tableNumber, diningType, items, hotelId } = req.body;

  try {
    const order = await CustomerOrder.create({
      customername,
      tableNumber,
      diningType,
      items,
      hotelId,
    });

    // Emit new order to hotel room
    global.io.to(`hotel-${hotelId}`).emit('newCustomerOrder', order);

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  }
};

const getHotelOrders = async (req, res) => {
  const { hotelId } = req.params;

  try {
    const orders = await CustomerOrder.findAll({
      where: { 
        hotelId, 
        status: { [Op.notIn]: ['completed', 'cancelled'] }
      },
      include: [
        {
          model: Staff,
          as: "staff",
          attributes: ["id", "name"]   // ⭐ Send staff name to frontend
        }
      ],
      order: [['createdat', 'DESC']],
    });

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
};

//  Update order (staff adds more items)
const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { items } = req.body;

  try {
    const order = await CustomerOrder.findByPk(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.items = items;
    order.updatedByStaff = true;
    await order.save();

    // Emit updated order
    global.io.to(`hotel-${order.hotelId}`).emit('orderUpdated', order);

    res.status(200).json({ message: 'Order updated', order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order' });
  }
};

//  Finalize order (after payment)
const finalizeOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await CustomerOrder.findByPk(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = 'finalized';
    await order.save();
    global.io.to(`hotel-${order.hotelId}`).emit('orderFinalized', order);
    res.status(200).json({ message: 'Order finalized', order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to finalize order' });
  }
};

// Call staff for help
const callStaffForHelp = async (req, res) => {
  const { customername, tableNumber, hotelId, message } = req.body;

  try {
    // Emit real-time notification to staff
    global.io.to(`hotel-${hotelId}`).emit('staffHelpRequested', {
      customername,
      tableNumber,
      hotelId,
      message,
      timestamp: new Date()
    });

    res.status(200).json({ message: 'Staff has been notified successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to notify staff' });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, paymentMethod } = req.body;

  try {
    const order = await CustomerOrder.findByPk(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    if (paymentMethod) {
      order.paymentMethod = paymentMethod;
    }
    await order.save();

    // Emit status update to customers and staff
 
    global.io.to(`hotel-${order.hotelId}`).emit('orderStatusUpdated', order);

    res.status(200).json({ message: 'Order status updated', order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Get single order by ID with product details
const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await CustomerOrder.findByPk(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Get product details for each item
    const itemsWithProducts = [];
    for (const item of order.items) {
      const product = await Product.findByPk(item.productId);
      if (product) {
        itemsWithProducts.push({
          quantity: item.quantity,
          Product: product
        });
      }
    }

    // Return order with enriched product data
    const orderData = {
      ...order.toJSON(),
      items: itemsWithProducts
    };

    res.status(200).json(orderData);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

module.exports = {
  placeOrder,
  getHotelOrders,
  updateOrder,
  finalizeOrder,
  callStaffForHelp,
  updateOrderStatus,
  getOrderById,
};
