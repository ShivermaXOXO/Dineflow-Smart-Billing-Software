const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  hotelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  itemName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('raw_materials', 'beverages', 'packaged_goods', 'cleaning_supplies', 'equipment', 'other'),
    allowNull: false,
    defaultValue: 'raw_materials',
  },
  unit: {
    type: DataTypes.ENUM('kg', 'g', 'liters', 'ml', 'pieces', 'packets', 'boxes', 'bottles'),
    allowNull: false,
  },
  quantityPurchased: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currentStock: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  minStockLevel: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  maxStockLevel: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: null,
  },
  costPerUnit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  totalCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  supplier: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  purchaseDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'low_stock', 'out_of_stock', 'expired'),
    defaultValue: 'active',
  },
}, {
  tableName: 'inventory',
  timestamps: true,
});

module.exports = Inventory;
