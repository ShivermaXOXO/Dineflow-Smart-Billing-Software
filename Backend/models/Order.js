const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  orderNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    field: 'ordernumber'
  },

  customername: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
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
    defaultValue: [],
  },

  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'totalamount'
  },

  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
  },

  hotelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'hotelid'
  },

  staffId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'staffid'
  },

  acceptedat: {
    type: DataTypes.DATE,
    field: 'acceptedat'
  },

  completedat: {
    type: DataTypes.DATE,
    field: 'completedat'
  },

  notes: {
    type: DataTypes.TEXT,
  },

}, {
  tableName: 'orders',

  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat'
});


// Define associations
Order.associate = (models) => {
  if (models.Staff) {
    Order.belongsTo(models.Staff, { foreignKey: 'staffId', as: 'assignedStaff' });
  }
  if (models.Hotels) {
    Order.belongsTo(models.Hotels, { foreignKey: 'hotelId' });
  }
};

module.exports = Order;
