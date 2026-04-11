const { Op } = require('sequelize');
const Bill = require('../models/Bill');
const Staff = require('../models/Staff');
const Product = require('../models/Product');
const { identifyRepeatCustomers } = require('./repeatCustomerController');
const XLSX = require('xlsx');
const { sendWhatsAppBill } = require('../utils/whatsappService');
//  Create Bill

// ✅ CORRECTED createBill function in billController.js
const createBill = async (req, res) => {
  const { 
    customername, 
    phoneNumber, 
    items, 
    total, 
    finalTotal,
    paymentType, 
    staffId, 
    hotelId, 
    tableNumber, 
    diningType, 
    carDetails,
    orderId, // ✅ Get orderId from request
    orderNumber // ✅ Get orderNumber from request
  } = req.body;
 


  try {
    // Create bill with order reference
    const bill = await Bill.create({ 
      customername, 
      phoneNumber, 
      items, 
      total: total, 
      paymentType, 
      staffId, 
      hotelId, 
      tableNumber, 
      diningType, 
      carDetails,
      orderId, // ✅ Store orderId in bill
      orderNumber // ✅ Store orderNumber in bill
    });
    


    // ✅ Update the order status to 'completed' if orderId is provided
    if (orderId) {
     
      try {
        const Order = require('../models/Order');
        const order = await Order.findByPk(orderId);
        
        if (order) {
        
          
          // Update order status and assign staff
          order.status = 'completed';
          order.staffId = staffId; // Assign staff who created the bill
          order.completedat = new Date();
          order.totalAmount = finalTotal;
          
          await order.save();
          
          order.status = 'completed';
          await order.save();
         
          // Emit order status update
          global.io.to(`hotel-${hotelId}`).emit('orderStatusChanged', order);
          global.io.to(`hotel-${hotelId}`).emit('orderUpdated');
        } else {
         ;
        }
      } catch (orderError) {
        console.error('❌ Error updating order:', orderError);
        // Don't fail bill creation if order update fails
      }
    }
    
    // Automatically identify repeat customers after creating a bill
    try {
      await identifyRepeatCustomers(hotelId);
      ('✅ Repeat customers identified after bill creation');
    } catch (error) {
      console.error('❌ Error identifying repeat customers:', error);
      // Don't fail the bill creation if repeat customer identification fails
    }
    
    // Emit socket event to notify all connected clients about the new bill
    global.io.to(`hotel-${hotelId}`).emit('billCreated', {
      billId: bill.id,
      orderId: orderId,
      customername: customername,
      total: total,
      paymentType: paymentType,
      staffId: staffId,
      hotelId: hotelId,
      timestamp: new Date()
    });
    global.io.to(`hotel-${hotelId}`).emit("orderUpdated", {
      type: "COMPLETED",
      orderId,
      hotelId
    });
    global.io.to(`hotel-${hotelId}`).emit("orderUpdated", {
      type: "CREATED",
      orderId,
      hotelId
    });

   
    if (phoneNumber) {
      sendWhatsAppBill(phoneNumber, customername, finalTotal, items);
    }
    res.status(201).json({ 
      message: "Bill Created Successfully", 
      bill: bill,
      orderUpdated: !!orderId
    });
  } catch (err) {
    console.error('❌ Error creating bill:', err);
    res.status(500).json({ 
      error: "Error occurred while creating bill", 
      details: err.message 
    });
  }
};

// Get all completed bills (staff + admin)
const getCompletedBills = async (req, res) => {
  const { hotelId } = req.params;

  try {
    const bills = await Bill.findAll({
      where: {
        hotelId,
      },
      include: [
        {
          model: Staff,
          as: "staff",
          attributes: ["id", "name", "email"]   // staff who created order
        }
      ],
    });

    res.status(200).json(bills);

  } catch (error) {
    console.error("Error fetching completed bills:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get All Orders for a Hotel
const getOrdersByHotel = async (req, res) => {
  const { hotelId } = req.params;


  try {
    // Validate hotelId
    if (!hotelId || isNaN(hotelId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid hotel ID" 
      });
    }

    const numericHotelId = parseInt(hotelId);

 
    
    // Get ALL orders without any filters
    const orders = await Bill.findAll({
      where: { 
        hotelId: numericHotelId 
      },
      include: [{ 
        model: Staff, 
        as: "staff", 
        attributes: ["id", "name", "email"] 
      }],
      order: [['createdat', 'DESC']],
      raw: true,
      nest: true
    });



    // Process orders safely
    const processedOrders = orders.map((order, index) => {
      try {
        // Safely handle items
        let items = [];
        if (order.items) {
          if (Array.isArray(order.items)) {
            items = order.items;
           
          } else if (typeof order.items === 'string') {
            try {
              const parsed = JSON.parse(order.items);
              items = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
              console.warn(`❌ Failed to parse items for order ${order.id}:`, order.items);
              items = [];
            }
          }
        }

        return {
          id: order.id,
          customername: order.customername || 'N/A',
          phoneNumber: order.phonenumber || 'N/A',
          items: items,
          total: Number(order.total ?? order.finaltotal ?? 0),
          paymentType: order.paymenttype || 'cash',
          staff: order.staff || { name: 'Unknown Staff' },
          createdat: order.createdat,
          tableNumber: order.tableNumber,
          diningType: order.diningType,
          carDetails: order.carDetails
        };
      } catch (error) {
        console.error(`❌ Error processing order ${order.id}:`, error);
        return null;
      }
    }).filter(order => order !== null); // Remove null orders

 

    res.status(200).json(processedOrders); // Return direct array

  } catch (error) {
    console.error("❌ Error in getOrdersByHotel:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch orders",
      message: error.message
    });
  }
};
//  Hotel Summary (Daily/Weekly/Monthly)

const getHotelSummary = async (req, res) => {
  const { hotelId } = req.params;
  const { range } = req.query;

  let startDate;
  let endDate;
  const now = new Date();

  switch (range) {
    case 'yesterday':
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 0, 0, 0));
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 23, 59, 59, 999));
      break;

    case 'week':
      startDate = new Date();
      startDate.setUTCDate(now.getUTCDate() - 6);
      startDate.setUTCHours(0, 0, 0, 0);
      break;

    case 'month':
      startDate = new Date();
      startDate.setUTCDate(now.getUTCDate() - 29);
      startDate.setUTCHours(0, 0, 0, 0);
      break;

    case 'day':
    default:
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
      break;
  }

  try {
    const whereClause = {
      hotelId,
    };

    if (range === 'day' || range === 'yesterday' || !range) {
      whereClause.createdat = {
        [Op.gte]: startDate,
        [Op.lte]: endDate,
      };
    } else {
      whereClause.createdat = {
        [Op.gte]: startDate,
      };
    }

    const bills = await Bill.findAll({
      where: whereClause,
      raw: true,
    });

    // Group by date
    const dailyData = {};
    for (const bill of bills) {
      const dateKey = new Date(bill.createdat).toISOString().slice(0, 10);
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { date: dateKey, totalOrders: 0, totalRevenue: 0 };
      }
      dailyData[dateKey].totalOrders += 1;
      dailyData[dateKey].totalRevenue += Number(bill.total || 0);
    }

    // Fill missing dates
    const result = [];
    const endLoopDate = (range === 'day' || range === 'yesterday' || !range) ? endDate : now;

    for (
      let d = new Date(startDate);
      d <= endLoopDate;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const key = d.toISOString().slice(0, 10);
     
      result.push(dailyData[key] || { date: key, totalOrders: 0, totalRevenue: 0 });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generating summary' });
  }
};


// Payment Method Breakdown

const getPaymentMethodBreakdown = async (req, res) => {
  const { hotelId } = req.params;

  try {
    const bills = await Bill.findAll({ where: { hotelId }, raw: true });

    const summary = {};
    for (const bill of bills) {
      const method = bill.paymentType;
      if (!summary[method]) {
        summary[method] = { paymentType: method, totalOrders: 0, totalRevenue: 0 };
      }
      summary[method].totalOrders += 1;
      summary[method].totalRevenue += bill.total;
    }

    res.json(Object.values(summary));
  } catch (err) {
    res.status(500).json({ error: 'Error fetching payment breakdown' });
  }
};


// Top 5 Selling Products
const getTopProducts = async (req, res) => {
  const { hotelId } = req.params;

  try {
    const bills = await Bill.findAll({ where: { hotelId }, raw: true });
    const productStats = {};

    for (const bill of bills) {
      let items = bill.items;

      try {
        if (typeof items === 'string') {
          items = JSON.parse(items);
        }
      } catch (e) {
        continue;
      }

      if (!items || !Array.isArray(items)) continue;

      for (const item of items) {
        const id = item.productId;

        if (!productStats[id]) {
          productStats[id] = { productId: id, quantity: 0, revenue: 0 };
        }

        productStats[id].quantity += item.quantity || 0;
        productStats[id].revenue += (item.price || 0) * (item.quantity || 0);
      }
    }

    const productIds = Object.keys(productStats);
    if (productIds.length === 0) return res.json([]);

    const products = await Product.findAll({
      where: { id: productIds },
      raw: true,
    });

    const result = products.map(p => ({
      productId: p.id,
      name: p.name,
      quantity: productStats[p.id].quantity,
      revenue: productStats[p.id].revenue,
    }));

    const top5 = result.sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    res.json(top5);
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute top products' });
  }
};


//  Revenue by Staff

const getRevenueByStaff = async (req, res) => {
  const { hotelId } = req.params;

  try {
    const bills = await Bill.findAll({
      where: { hotelId },
      include: [{ model: Staff, as: 'staff', attributes: ['id', 'name'] }],
      raw: true,
      nest: true,
    });

    const staffStats = {};

    for (const bill of bills) {
      const id = bill.staff.id;
      if (!staffStats[id]) {
        staffStats[id] = { staffId: id, name: bill.staff.name, orders: 0, revenue: 0 };
      }
      staffStats[id].orders += 1;
      staffStats[id].revenue += bill.total;
    }

    res.json(Object.values(staffStats));
  } catch (err) {
    res.status(500).json({ error: 'Error computing staff revenue' });
  }
};


//  Hourly Order Trends

const getHourlyTrends = async (req, res) => {
  const { hotelId } = req.params;

  try {
    const bills = await Bill.findAll({ where: { hotelId }, raw: true });

    const hourlyStats = Array.from({ length: 24 }, (_, h) => ({
      hour: `${h}:00`,
      orders: 0,
      revenue: 0
    }));

    for (const bill of bills) {
      const hour = new Date(bill.createdat).getHours();
      hourlyStats[hour].orders += 1;
      hourlyStats[hour].revenue += bill.total;
    }

    res.json(hourlyStats);
  } catch (err) {
    res.status(500).json({ error: 'Error computing hourly trends' });
  }
};

// Enhanced Hotel Summary with better date range support
const getEnhancedHotelSummary = async (req, res) => {
  const { hotelId } = req.params;
  const { range, startDate, endDate } = req.query;

  let whereClause = { hotelId };
  const now = new Date();

  // Handle custom date ranges
  if (startDate && endDate) {
    whereClause.createdat = {
      [Op.gte]: new Date(startDate),
      [Op.lte]: new Date(endDate)
    };
  } else {
    // Handle predefined ranges
    let start, end;
    
    switch (range) {
      case 'today':
        start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
        end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
        break;
        
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        start = new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate(), 0, 0, 0));
        end = new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate(), 23, 59, 59, 999));
        break;
        
      case 'last7days':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        start.setUTCHours(0, 0, 0, 0);
        end = new Date();
        break;
        
      case 'lastMonth':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        start.setUTCHours(0, 0, 0, 0);
        end = new Date();
        break;
        
      case 'last6months':
        start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        start.setUTCHours(0, 0, 0, 0);
        end = new Date();
        break;
        
      case 'week':
        start = new Date();
        start.setUTCDate(now.getUTCDate() - 6);
        start.setUTCHours(0, 0, 0, 0);
        end = new Date();
        break;
        
      case 'month':
        start = new Date();
        start.setUTCDate(now.getUTCDate() - 29);
        start.setUTCHours(0, 0, 0, 0);
        end = new Date();
        break;
        
      case 'day':
      default:
        start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
        end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
        break;
    }

    if (start && end) {
      whereClause.createdat = {
        [Op.gte]: start,
        [Op.lte]: end
      };
    } else if (start) {
      whereClause.createdat = {
        [Op.gte]: start
      };
    }
  }

  try {
    const bills = await Bill.findAll({
      where: whereClause,
      raw: true,
    });

    // Group by date
    const dailyData = {};
    for (const bill of bills) {
      const dateKey = new Date(bill.createdat).toISOString().slice(0, 10);
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { date: dateKey, totalOrders: 0, totalRevenue: 0 };
      }
      dailyData[dateKey].totalOrders += 1;
      dailyData[dateKey].totalRevenue += Number(bill.total || 0);
    }

    // Fill missing dates for better visualization
    const result = [];
    const startLoop = whereClause.createdat ? whereClause.createdat[Op.gte] : new Date();
    const endLoop = whereClause.createdat ? (whereClause.createdat[Op.lte] || new Date()) : new Date();

    for (
      let d = new Date(startLoop);
      d <= endLoop;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const key = d.toISOString().slice(0, 10);
      result.push(dailyData[key] || { date: key, totalOrders: 0, totalRevenue: 0 });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generating enhanced summary' });
  }
};

// Get detailed items analysis
const getItemsAnalysis = async (req, res) => {
  const { hotelId } = req.params;
  const { range, startDate, endDate } = req.query;

  let whereClause = { hotelId };
  const now = new Date();

  // Apply same date filtering logic as enhanced summary
  if (startDate && endDate) {
    whereClause.createdat = {
      [Op.gte]: new Date(startDate),
      [Op.lte]: new Date(endDate)
    };
  } else if (range) {
    // Same date range logic as above...
    let start, end;
    
    switch (range) {
      case 'today':
        start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
        end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        start = new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate(), 0, 0, 0));
        end = new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate(), 23, 59, 59, 999));
        break;
      case 'last7days':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'lastMonth':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last6months':
        start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
        end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    }

    if (start && end) {
      whereClause.createdat = { [Op.gte]: start, [Op.lte]: end };
    } else if (start) {
      whereClause.createdat = { [Op.gte]: start };
    }
  }

  try {
    const bills = await Bill.findAll({
      where: whereClause,
      raw: true,
    });

    const itemsData = {};
    const dailyItemsData = {};

    for (const bill of bills) {
      const orderDate = new Date(bill.createdat).toISOString().slice(0, 10);
      let items;

      try {
        items = typeof bill.items === 'string' ? JSON.parse(bill.items) : bill.items;
      } catch (e) {
        continue;
      }

      if (!items || !Array.isArray(items)) continue;

      for (const item of items) {
        const itemName = item.name || 'Unknown Item';
        const quantity = item.quantity || 0;
        const price = item.price || 0;
        const revenue = price * quantity;

        // Overall items stats
        if (!itemsData[itemName]) {
          itemsData[itemName] = {
            name: itemName,
            totalQuantity: 0,
            totalRevenue: 0,
            totalOrders: 0
          };
        }
        itemsData[itemName].totalQuantity += quantity;
        itemsData[itemName].totalRevenue += revenue;
        itemsData[itemName].totalOrders += 1;

        // Daily items stats
        const dailyKey = `${orderDate}-${itemName}`;
        if (!dailyItemsData[dailyKey]) {
          dailyItemsData[dailyKey] = {
            date: orderDate,
            name: itemName,
            quantity: 0,
            revenue: 0,
            orders: 0
          };
        }
        dailyItemsData[dailyKey].quantity += quantity;
        dailyItemsData[dailyKey].revenue += revenue;
        dailyItemsData[dailyKey].orders += 1;
      }
    }

    const result = {
      overall: Object.values(itemsData).sort((a, b) => b.totalQuantity - a.totalQuantity),
      daily: Object.values(dailyItemsData).sort((a, b) => new Date(b.date) - new Date(a.date))
    };

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generating items analysis' });
  }
};

// Get Admin Stats - similar to staff stats but for admin users
const getAdminStats = async (req, res) => {
  const { hotelId, adminId } = req.params;
  


  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

 

    // Get bills created by this admin today (completed orders)
    const todayBills = await Bill.findAll({
      where: {
        hotelId: hotelId,
        staffId: adminId,
        createdat: {
          [Op.between]: [startOfDay, endOfDay]
        }
      }
    });

    // Get orders created by this admin today (pending/in-progress orders)  
    const Order = require('../models/Order');
    const todayOrders = await Order.findAll({
      where: {
        hotelId: hotelId,
        staffId: adminId,
        createdat: {
          [Op.between]: [startOfDay, endOfDay]
        }
      }
    });



    const totalRevenue = todayBills.reduce((sum, bill) => sum + parseFloat(bill.total || 0), 0);
    const completedOrders = todayBills.length;
    const totalOrders = completedOrders + todayOrders.length;

    const stats = {
      myOrders: completedOrders, // Only completed bills
      myRevenue: totalRevenue,
      currentShiftOrders: totalOrders, // Both bills and orders
      avgOrderValue: completedOrders > 0 ? totalRevenue / completedOrders : 0
    };

   
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      error: 'Error fetching admin stats',
      myOrders: 0,
      myRevenue: 0,
      currentShiftOrders: 0,
      avgOrderValue: 0
    });
  }
};
const exportOrdersToExcel = async (req, res) => {
  const { hotelId } = req.params;
  const { 
    startDate, 
    endDate, 
    exportType = 'download' // 'download' or 's3'
  } = req.query;

  try {
    // Validate hotelId
    if (!hotelId || isNaN(hotelId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid hotel ID" 
      });
    }

    const numericHotelId = parseInt(hotelId);

    // Calculate date range (up to 5 years)
    let dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Validate date range (max 5 years)
      const maxDateRange = 5 * 365 * 24 * 60 * 60 * 1000; // 5 years in milliseconds
      if (end - start > maxDateRange) {
        return res.status(400).json({
          success: false,
          error: "Date range cannot exceed 5 years"
        });
      }
      
      dateFilter = {
        createdat: {
          [Op.between]: [start, end]
        }
      };
    } else {
      // Default to last 30 days if no date range provided
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = {
        createdat: {
          [Op.gte]: thirtyDaysAgo
        }
      };
    }



    // Fetch orders with date filter
    const orders = await Bill.findAll({
      where: { 
        hotelId: numericHotelId,
        ...dateFilter
      },
      include: [{ 
        model: Staff, 
        as: "staff", 
        attributes: ["id", "name", "email"] 
      }],
      order: [['createdat', 'DESC']],
      raw: true,
      nest: true
    });


    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No orders found for the specified criteria"
      });
    }

    // Process orders data for Excel
    const excelData = orders.map((order, index) => {
      // Safely handle items
      let items = [];
      let itemsText = '';
      
      if (order.items) {
        if (Array.isArray(order.items)) {
          items = order.items;
        } else if (typeof order.items === 'string') {
          try {
            const parsed = JSON.parse(order.items);
            items = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {
            console.warn(`Failed to parse items for order ${order.id}`);
            items = [];
          }
        }
        
        // Convert items to readable text
        itemsText = items.map(item => 
          `${item.name || 'Unknown Item'} (Qty: ${item.quantity || 0}, Price: ₹${item.price || 0})`
        ).join('; ');
      }

      return {
        'Order ID': order.id,
        'Customer Name': order.customername || 'N/A',
        'Phone Number': order.phonenumber || 'N/A',
        'Items': itemsText,
        'Total Amount (₹)': order.total || 0,
        'Payment Type': order.paymentType || 'cash',
        'Staff Name': order.staff?.name || 'Unknown Staff',
        'Staff Email': order.staff?.email || 'N/A',
        'Table Number': order.tableNumber || 'N/A',
        'Dining Type': order.diningType || 'N/A',
        'Car Details': order.carDetails || 'N/A',
        'Order Date': order.createdat ? new Date(order.createdat).toLocaleString() : 'N/A',
        'Date Only': order.createdat ? new Date(order.createdat).toISOString().split('T')[0] : 'N/A'
      };
    });

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `hotel_${hotelId}_orders_${timestamp}.xlsx`;

    if (exportType === 's3') {
      // For S3 upload - you'll need to implement this based on your AWS setup
      // const s3Url = await uploadToS3(workbook, filename);
      // return res.json({
      //   success: true,
      //   message: "File uploaded to S3 successfully",
      //   url: s3Url
      // });
      
      // For now, we'll return a message that S3 upload needs to be configured
      return res.json({
        success: false,
        message: "S3 export configuration required. File downloaded locally instead.",
        // Fallback to download
        buffer: XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
        filename: filename
      });
    } else {
      // For direct download
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Length', excelBuffer.length);
      
      // Send the file
      res.send(excelBuffer);
    }

  } catch (error) {
    console.error("❌ Error in exportOrdersToExcel:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to export orders",
      message: error.message
    });
  }
};

const deleteBill = async (req, res) => {
  const { billId } = req.params;


  try {
    // Validate billId
    if (!billId || isNaN(billId)) {
    
      return res.status(400).json({ 
        success: false,
        error: "Invalid bill ID" 
      });
    }

    const numericBillId = parseInt(billId);

    // Find the bill first to check if it exists
    // Use raw query to avoid JSON parsing issues
    const bill = await Bill.findOne({
      where: { id: numericBillId },
      raw: true, // Get raw data without Sequelize parsing
      attributes: ['id', 'customername', 'total'] // Only get necessary fields
    });
    
    if (!bill) {

      return res.status(404).json({
        success: false,
        error: "Bill not found"
      });
    }

    // Delete the bill using raw query to avoid JSON parsing
    await Bill.destroy({
      where: { id: numericBillId }
    });



    res.status(200).json({
      success: true,
      message: "Bill deleted successfully"
    });

  } catch (error) {
    console.error("❌ Error in deleteBill:", error);
    
    // Handle specific JSON parsing errors
    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    
      
      try {
        // Try alternative approach without JSON parsing
        const numericBillId = parseInt(billId);
        
        // Use direct query to delete without parsing JSON fields
        const result = await Bill.destroy({
          where: { id: numericBillId }
        });
        
        if (result) {
        
          return res.status(200).json({
            success: true,
            message: "Bill deleted successfully"
          });
        } else {
          return res.status(404).json({
            success: false,
            error: "Bill not found"
          });
        }
      } catch (altError) {
        console.error("❌ Alternative delete also failed:", altError);
        return res.status(500).json({ 
          success: false,
          error: "Failed to delete bill due to data corruption"
        });
      }
    }
    
    res.status(500).json({ 
      success: false,
      error: "Failed to delete bill",
      message: error.message
    });
  }
};

module.exports = {
  createBill,
  getOrdersByHotel,
  getCompletedBills,
  getHotelSummary,
  getPaymentMethodBreakdown,
  getTopProducts,
  getRevenueByStaff,
  getHourlyTrends,
  getEnhancedHotelSummary,
  getItemsAnalysis,
  getAdminStats,
  exportOrdersToExcel,
  deleteBill
};
