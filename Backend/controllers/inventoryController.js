const { Op } = require('sequelize');
const Inventory = require('../models/Inventory');

// Create new inventory item
const createInventoryItem = async (req, res) => {
  try {
    let {
      hotelId,
      itemName,
      category,
      unit,
      quantityPurchased,
      costPerUnit,
      supplier,
      purchaseDate,
      expiryDate,
      minStockLevel,
      maxStockLevel,
      notes
    } = req.body;

    // Convert empty strings to null
    const cleanNumber = (value) => {
      if (value === "" || value === null || value === undefined) return 0;
      return Number(value);
    };

    const cleanText = (value) => {
      if (value === "" || value === null || value === undefined) return null;
      return value;
    };

    const cleanDate = (value) => {
      if (!value || value === "" || value === "Invalid date") return null;
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    };

    // Sanitize inputs
    quantityPurchased = cleanNumber(quantityPurchased);
    costPerUnit = cleanNumber(costPerUnit);
    minStockLevel = cleanNumber(minStockLevel);
    maxStockLevel = cleanNumber(maxStockLevel);

    notes = cleanText(notes);
    supplier = cleanText(supplier);

    const parsedPurchaseDate = cleanDate(purchaseDate) || new Date();
    const parsedExpiryDate = cleanDate(expiryDate);

    // Calculated fields
    const totalCost = quantityPurchased * costPerUnit;
    const currentStock = quantityPurchased;

    const inventoryItem = await Inventory.create({
      hotelId,
      itemName,
      category,
      unit,
      quantityPurchased,
      currentStock,
      costPerUnit,
      totalCost,
      supplier,
      purchaseDate: parsedPurchaseDate,
      expiryDate: parsedExpiryDate,
      minStockLevel,
      maxStockLevel,
      notes,
      status: "active"
    });

    res.status(201).json({
      message: "Inventory item created successfully",
      item: inventoryItem
    });

  } catch (error) {
    console.error("Error creating inventory item:", error);
    res.status(500).json({ error: "Failed to create inventory item" });
  }
};


// Get all inventory items for a hotel
const getInventoryByHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { category, status, month, year } = req.query;

    let whereClause = { hotelId };

    // Filter by category
    if (category && category !== 'all') {
      whereClause.category = category;
    }

    // Filter by status
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Filter by month and year
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      whereClause.purchaseDate = {
        [Op.between]: [startDate, endDate]
      };
    } else if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      whereClause.purchaseDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const inventory = await Inventory.findAll({
      where: whereClause,
      order: [['purchaseDate', 'DESC'], ['itemName', 'ASC']]
    });

    // Update status based on current stock and expiry
    const updatedInventory = inventory.map(item => {
      let status = 'active';
      
      if (item.expiryDate && new Date() > new Date(item.expiryDate)) {
        status = 'expired';
      } else if (item.currentStock <= 0) {
        status = 'out_of_stock';
      } else if (item.currentStock <= item.minStockLevel) {
        status = 'low_stock';
      }

      // Update status in database if different
      if (status !== item.status) {
        item.update({ status });
      }

      return { ...item.toJSON(), status };
    });

    res.status(200).json(updatedInventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

// Update inventory item
const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Recalculate total cost if quantity or cost per unit changes
    if (updates.quantityPurchased || updates.costPerUnit) {
      const item = await Inventory.findByPk(id);
      if (item) {
        const quantity = updates.quantityPurchased || item.quantityPurchased;
        const cost = updates.costPerUnit || item.costPerUnit;
        updates.totalCost = quantity * cost;
      }
    }

    const [updatedRows] = await Inventory.update(updates, {
      where: { id },
      returning: true
    });

    if (updatedRows === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const updatedItem = await Inventory.findByPk(id);
    res.status(200).json({
      message: 'Inventory item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
};

// Delete inventory item
const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRows = await Inventory.destroy({
      where: { id }
    });

    if (deletedRows === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
};

// Get inventory analytics
const getInventoryAnalytics = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { year } = req.query;

    let whereClause = { hotelId };

    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      whereClause.purchaseDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const inventory = await Inventory.findAll({
      where: whereClause,
      raw: true
    });

    // Monthly spending analysis
    const monthlySpending = {};
    for (let i = 0; i < 12; i++) {
      monthlySpending[i] = { month: i + 1, totalCost: 0, itemCount: 0 };
    }

    // Category-wise analysis
    const categoryAnalysis = {};

    // Supplier analysis
    const supplierAnalysis = {};

    // Low stock alerts
    const lowStockItems = [];
    const expiringSoonItems = [];

    inventory.forEach(item => {
  // Skip undefined/null items
  if (!item) return;

  // Skip missing purchaseDate
  if (!item.purchaseDate) return;

  const purchaseMonth = new Date(item.purchaseDate).getMonth();

  const cost = parseFloat(item.totalCost || 0) || 0;

  // Monthly spending
  if (!monthlySpending[purchaseMonth]) {
    monthlySpending[purchaseMonth] = { month: purchaseMonth + 1, totalCost: 0, itemCount: 0 };
  }
  monthlySpending[purchaseMonth].totalCost += cost;
  monthlySpending[purchaseMonth].itemCount += 1;

  // Category analysis
  const category = item.category || "Unknown";

  if (!categoryAnalysis[category]) {
    categoryAnalysis[category] = {
      totalCost: 0,
      itemCount: 0,
      averageCost: 0
    };
  }
  categoryAnalysis[category].totalCost += cost;
  categoryAnalysis[category].itemCount += 1;

  // Supplier analysis
  if (item.supplier) {
    if (!supplierAnalysis[item.supplier]) {
      supplierAnalysis[item.supplier] = {
        totalCost: 0,
        itemCount: 0,
        categories: new Set()
      };
    }
    supplierAnalysis[item.supplier].totalCost += cost;
    supplierAnalysis[item.supplier].itemCount += 1;
    supplierAnalysis[item.supplier].categories.add(category);
  }

  // Stock alerts
  if (item.currentStock !== undefined && item.minStockLevel !== undefined) {
    if (item.currentStock <= item.minStockLevel) {
      lowStockItems.push({
        id: item.id,
        itemName: item.itemName,
        currentStock: item.currentStock,
        minStockLevel: item.minStockLevel,
        category
      });
    }
  }

  // Expiry alerts
  if (item.expiryDate) {
    const expiryDate = new Date(item.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      expiringSoonItems.push({
        id: item.id,
        itemName: item.itemName,
        expiryDate: item.expiryDate,
        daysUntilExpiry,
        currentStock: item.currentStock
      });
    }
  }
});


    // Calculate averages for categories
    Object.keys(categoryAnalysis).forEach(category => {
      categoryAnalysis[category].averageCost = 
        categoryAnalysis[category].totalCost / categoryAnalysis[category].itemCount;
    });

    // Convert supplier analysis
    const supplierData = Object.keys(supplierAnalysis).map(supplier => ({
      supplier,
      totalCost: supplierAnalysis[supplier].totalCost,
      itemCount: supplierAnalysis[supplier].itemCount,
      categories: Array.from(supplierAnalysis[supplier].categories)
    }));

    res.status(200).json({
      monthlySpending: Object.values(monthlySpending),
      categoryAnalysis: Object.keys(categoryAnalysis).map(category => ({
        category,
        ...categoryAnalysis[category]
      })),
      supplierAnalysis: supplierData,
      alerts: {
        lowStockItems,
        expiringSoonItems
      },
      summary: {
        totalItems: inventory.length,
        totalValue: inventory.reduce((sum, item) => sum + parseFloat(item.totalCost || 0), 0),
        totalSuppliers: Object.keys(supplierAnalysis).length,
        averageItemCost: inventory.length > 0 ? inventory.reduce((sum, item) => sum + parseFloat(item.totalCost || 0), 0) / inventory.length : 0
      }
    });
  } catch (error) {
    console.error('Error fetching inventory analytics:', error);
    res.status(500).json({ error: 'Failed to fetch inventory analytics' });
  }
};

// Update stock levels (for consumption tracking)
const updateStockLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityUsed, reason } = req.body;

    const item = await Inventory.findByPk(id);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const newStock = Math.max(0, parseFloat(item.currentStock) - parseFloat(quantityUsed));
    
    let status = item.status;
    if (newStock <= 0) {
      status = 'out_of_stock';
    } else if (newStock <= item.minStockLevel) {
      status = 'low_stock';
    } else {
      status = 'active';
    }

    await item.update({
      currentStock: newStock,
      status,
      notes: item.notes ? `${item.notes}\n${new Date().toISOString().split('T')[0]}: Used ${quantityUsed} ${item.unit} - ${reason || 'No reason provided'}` : `${new Date().toISOString().split('T')[0]}: Used ${quantityUsed} ${item.unit} - ${reason || 'No reason provided'}`
    });

    res.status(200).json({
      message: 'Stock level updated successfully',
      item: await Inventory.findByPk(id)
    });
  } catch (error) {
    console.error('Error updating stock level:', error);
    res.status(500).json({ error: 'Failed to update stock level' });
  }
};

module.exports = {
  createInventoryItem,
  getInventoryByHotel,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryAnalytics,
  updateStockLevel
};
