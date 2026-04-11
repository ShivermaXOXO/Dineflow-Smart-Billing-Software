// models/Bill.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const QROrders = sequelize.define('qrorders', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  order_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  table_number: {
    type: DataTypes.STRING,
  },

  items: {
    type: DataTypes.JSONB,
    allowNull: false,
  },

  hotel_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  total: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },

  session_id: {
    type: DataTypes.STRING,
  },

  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  },

  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'qrorders',
  timestamps: false,
});
module.exports = QROrders;