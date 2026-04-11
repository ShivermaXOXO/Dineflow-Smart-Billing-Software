// models/Bill.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Bill = sequelize.define('Bill', {
  customername: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'customername'
  },

  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'phonenumber'
  },

  tableNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'tablenumber'
  },

  diningType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'diningtype'
  },

  carDetails: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'cardetails'
  },

  items: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'items'
  },

  total: {
    type: DataTypes.FLOAT,
    allowNull: false,
    field: 'total'
  },

  paymentType: {
    type: DataTypes.STRING,
    defaultValue: 'cash',
    field: 'paymenttype'
  },

  staffId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'staffid'
  },

  hotelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'hotelid'
  }

}, {
  tableName: 'bills',
  freezeTableName: true,
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat'
});

// Export the model and an `associate` function
Bill.associate = (models) => {
  Bill.belongsTo(models.Staff, { foreignKey: 'staffId', as: 'staff' });
};

module.exports = Bill;
