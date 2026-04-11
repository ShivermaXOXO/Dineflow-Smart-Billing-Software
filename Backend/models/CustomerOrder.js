const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const Hotel = require('./Hotels');

const CustomerOrder = sequelize.define('CustomerOrder', {
     customername: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tableNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  diningType: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['dine-in', 'takeaway']]
    }
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'delivered', 'payment', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'online'),
    allowNull: true,
  },
  updatedByStaff: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  hotelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});
Hotel.hasMany(CustomerOrder, {foreignKey: 'hotelId'});
CustomerOrder.belongsTo(Hotel, {foreignKey:'hotelId'});

module.exports = CustomerOrder