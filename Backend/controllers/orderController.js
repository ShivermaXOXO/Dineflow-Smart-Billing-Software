const Order = require('../models/Order');
const Product = require('../models/Product');
const { Op } = require('sequelize');

// Create a new order (can be from walk-in customers or phone orders)
const createOrder = async (req, res) => {
  const { customername, phoneNumber, tableNumber, diningType, carDetails, items, notes, hotelId, staffId, total,status } = req.body;
  try {
 
    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Calculate total amount if not provided
    let calculatedTotal = total;
    // if (!calculatedTotal) {
    //   calculatedTotal = 0;
    //   for (const item of items) {
    //     if (item.price) {
    //       // Use price from frontend if available
    //       calculatedTotal += parseFloat(item.price) * item.quantity;
    //     } else {
    //       // Fallback to database lookup
    //       const product = await Product.findByPk(item.productId);
    //       if (product) {
    //         calculatedTotal += parseFloat(product.price) * item.quantity;
    //       }
    //     }
    //   }
    // }

    const order = await Order.create({
      orderNumber,
      customername,
      phoneNumber,
      tableNumber,
      diningType,
      carDetails,
      items,
      totalAmount: calculatedTotal,
      notes,
      hotelId,
      staffId,
      status
    });

    // Emit new order to hotel room for real-time updates
    global.io.to(`hotel-${hotelId}`).emit('newOrder', order);

    res.status(201).json({ message: 'Order created successfully', order });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Get all orders for a hotel (with optional status filter)
const getHotelOrders = async (req, res) => {
  const { hotelId } = req.params;
  const { status, staffId } = req.query;

  try {
    const whereClause = { hotelId };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (staffId) {
      whereClause.staffId = staffId;
    }

    const orders = await Order.findAll({
      where: whereClause,
      order: [['createdat', 'DESC']],
      include: [
        {
          model: require('../models/Staff'),
          as: 'assignedStaff',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });
    
    res.status(200).json(orders);
  } catch (err) {
    console.error('Error fetching orders Hotel :', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Accept an order (assign to staff)
const acceptOrder = async (req, res) => {
  const { id } = req.params;
  const { staffId } = req.body;

  try {
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order is not available for acceptance' });
    }

    order.staffId = staffId;
    order.status = 'in_progress';
    order.acceptedat = new Date();
    await order.save();

    // Emit order update
    global.io.to(`hotel-${order.hotelId}`).emit('orderAccepted', order);

    res.status(200).json({ message: 'Order accepted successfully', order });
  } catch (err) {
    console.error('Error accepting order:', err);
    res.status(500).json({ error: 'Failed to accept order' });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, notes, staffId , finalTotal} = req.body;

  try {
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    order.totalAmount = finalTotal;
    if (notes) {
      order.notes = notes;
    }
    
    // Set staffId if provided (especially important for completed orders)
    if (staffId) {
      order.staffId = staffId;
    }
    
    if (status === 'completed') {
      order.completedat = new Date();
    }
    
    await order.save();

    // Emit order status update
    global.io.to(`hotel-${order.hotelId}`).emit('orderStatusChanged', order);

    res.status(200).json({ message: 'Order status updated', order });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Get order details with product information
const getOrderById = async (req, res) => {
  const { id } = req.params;


  try {
    const order = await Order.findByPk(id, {
      include: [
        {
          model: require('../models/Staff'),
          as: 'assignedStaff',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    if (!order) {
  
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get product details for each item
    const itemsWithProducts = [];
    for (const item of order.items) {
   
      let product = null;
      
      // Try to find product by productId first
      if (item.productId) {
        product = await Product.findByPk(item.productId);
      }
      
      // If no productId or product not found, try to find by name
      if (!product && item.name) {
        product = await Product.findOne({
          where: {
            name: item.name,
            hotelId: order.hotelId
          }
        });
    
      }
      
    
      if (product) {
        itemsWithProducts.push({
          quantity: item.quantity,
          Product: product
        });
      } else {
       
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

// Delete/Cancel an order
const cancelOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = 'cancelled';
    await order.save();

    // Emit order cancellation
    global.io.to(`hotel-${order.hotelId}`).emit('orderCancelled', order);

    res.status(200).json({ message: 'Order cancelled successfully', order });
  } catch (err) {
    console.error('Error cancelling order:', err);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

// Update an existing order
const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { customername, phoneNumber, tableNumber, diningType, carDetails, items, notes, totalAmount, staffId } = req.body;

  try {
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }


    // Calculate total amount from items if not provided
    let calculatedTotal = totalAmount;
    if (!calculatedTotal && items) {
      calculatedTotal = 0;
      for (const item of items) {
        calculatedTotal += parseFloat(item.price || 0) * item.quantity;
      }
    }

    // Update order fields
    const updatedFields = {
      customername: customername || order.customername,
      phoneNumber: phoneNumber || order.phoneNumber,
      tableNumber: tableNumber || order.tableNumber,
      diningType: diningType || order.diningType,
      carDetails: carDetails || order.carDetails,
      items: items ? items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        // Store additional data for consistency but productId is the key field
        name: item.name,
        price: item.price
      })) : order.items,
      totalAmount: calculatedTotal || order.totalAmount,
      notes: notes || order.notes,
      staffId: staffId || order.staffId
    };


    await order.update(updatedFields);

    // Emit order update for real-time updates
    global.io.to(`hotel-${order.hotelId}`).emit('orderUpdated', order);

    res.status(200).json({ message: 'Order updated successfully', order });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

// Delete an order
const deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const hotelId = order.hotelId;
    await order.destroy();

    // Emit order deletion for real-time updates
    global.io.to(`hotel-${hotelId}`).emit('orderDeleted', { id: parseInt(id) });

    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};

deleteOrdersByTimestamp = async (req, res) => {
  try {
    const { timestamp, hotelId, customerName, phoneNumber } = req.body;


    const start = new Date(timestamp);
    const end = new Date(start.getTime() + 2000); // 2 seconds

    const deletedCount = await Order.destroy({
      where: {
  hotelId,
  customername: customerName,
  completedat: {
    [Op.between]: [start, end]
  }
}

    });



    res.json({
      success: true,
      message: `Deleted ${deletedCount} orders matching the timestamp`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const checkCustomer = async (req, res) => {
  try {
    const { phone, hotelId } = req.query;

    if (!phone || !hotelId) {
      return res.json({ isLoyal: false, visits: 0 });
    }

    const visits = await Order.count({
      where: {
        phoneNumber: phone,
        hotelId
      }
    });

    return res.json({
      isLoyal: visits > 0, // loyal from 1st visit
      visits
    });

  } catch (error) {
    console.error('checkCustomer error:', error);
    return res.status(500).json({
      isLoyal: false,
      visits: 0
    });
  }
};




module.exports = {
  createOrder,
  getHotelOrders,
  acceptOrder,
  updateOrderStatus,
  getOrderById,
  cancelOrder,
  updateOrder,
  deleteOrder,
  deleteOrdersByTimestamp,
  checkCustomer
};
