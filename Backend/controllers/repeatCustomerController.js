// controllers/repeatCustomerController.js
const RepeatCustomer = require('../models/RepeatCustomer');
const Bill = require('../models/Bill');
const { Op } = require('sequelize');

// Function to identify and update repeat customers
const identifyRepeatCustomers = async (hotelId) => {
  try {
    // Get all bills from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBills = await Bill.findAll({
      where: {
        hotelId: hotelId,
        createdat: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      order: [['createdat', 'ASC']]
    });

    // Group bills by customer phone number
    const customerVisits = {};
    
   recentBills.forEach(bill => {
  const name = bill.customername?.toLowerCase()?.trim();
  const rawPhone = bill.phoneNumber;
  const phone = rawPhone ? String(rawPhone).toLowerCase().trim() : "";


  const skipNames = ["walk in customer", "walk-in customer", "walkin customer", "na", "n/a", "none", ""];
  const skipPhones = ["na", "n/a", "none", "", null, undefined];

  // Skip if name invalid OR phone invalid
  if (skipNames.includes(name) || skipPhones.includes(phone)) {
    return;
  }

  const key = bill.phoneNumber;

  if (!customerVisits[key]) {
    customerVisits[key] = {
      customername: bill.customername,
      phoneNumber: bill.phoneNumber,
      visits: [],
      totalSpent: 0
    };
  }

  customerVisits[key].visits.push({
    date: bill.createdat,
    amount: bill.total
  });

  customerVisits[key].totalSpent += bill.total;
});


    // Identify customers with 2+ visits
    const repeatCustomers = Object.values(customerVisits).filter(customer => customer.visits.length >= 2);

    // Update or create repeat customer records
    for (const customer of repeatCustomers) {
      const lastVisit = customer.visits[customer.visits.length - 1];
      
      await RepeatCustomer.upsert({
        customername: customer.customername,
        phoneNumber: customer.phoneNumber,
        hotelId: hotelId,
        totalVisits: customer.visits.length,
        lastVisitDate: lastVisit.date,
        totalSpent: customer.totalSpent,
        firstIdentifiedDate: new Date(),
        isActive: 1
      });
    }

    return repeatCustomers.length;
  } catch (error) {
    console.error('Error identifying repeat customers:', error);
    throw error;
  }
};

// Get all repeat customers for a hotel
const getRepeatCustomers = async (req, res) => {
  try {
    const { hotelId } = req.params;
    
    const repeatCustomers = await RepeatCustomer.findAll({
      where: {
        hotelId: hotelId,
        isActive: 1
      },
      order: [['totalVisits', 'DESC'], ['lastVisitDate', 'DESC']]
    });

    res.json(repeatCustomers);
  } catch (error) {
    console.error('Error fetching repeat customers:', error);
    res.status(500).json({ error: 'Failed to fetch repeat customers' });
  }
};

// Update repeat customers (trigger identification process)
const updateRepeatCustomers = async (req, res) => {
  try {
    const { hotelId } = req.params;
    
    const count = await identifyRepeatCustomers(hotelId);
    
    res.json({ 
      message: 'Repeat customers updated successfully',
      identifiedCount: count
    });
  } catch (error) {
    console.error('Error updating repeat customers:', error);
    res.status(500).json({ error: 'Failed to update repeat customers' });
  }
};

// Send WhatsApp message (placeholder - will need WhatsApp API integration)
const sendWhatsAppMessage = async (req, res) => {
  try {
    const { phoneNumbers, message } = req.body;
    
  
    // Simulate sending messages
    const results = phoneNumbers.map(phone => ({
      phoneNumber: phone,
      status: 'sent', // In real implementation, this would be the actual status
      messageId: `msg_${Date.now()}_${phone}`,
      timestamp: new Date()
    }));

    res.json({
      success: true,
      message: 'Messages sent successfully',
      results: results
    });
  } catch (error) {
    console.error('Error sending WhatsApp messages:', error);
    res.status(500).json({ error: 'Failed to send messages' });
  }
};

// Delete a repeat customer
const deleteRepeatCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    
    await RepeatCustomer.update(
      { isActive: 0 },
      { where: { id: id } }
    );

    res.json({ message: 'Repeat customer deactivated successfully' });
  } catch (error) {
    console.error('Error deleting repeat customer:', error);
    res.status(500).json({ error: 'Failed to delete repeat customer' });
  }
};

module.exports = {
  identifyRepeatCustomers,
  getRepeatCustomers,
  updateRepeatCustomers,
  sendWhatsAppMessage,
  deleteRepeatCustomer
};
