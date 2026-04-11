// models/RepeatCustomer.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RepeatCustomer = sequelize.define('RepeatCustomer', {
  customername: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Ensure each phone number is only stored once
  },
  hotelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  totalVisits: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lastVisitDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  totalSpent: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  firstIdentifiedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  isActive: {
    type: DataTypes.SMALLINT,
    defaultValue: 1, // Can be used to disable customers if needed
  }
});

// Export the model and an `associate` function
RepeatCustomer.associate = (models) => {
  RepeatCustomer.belongsTo(models.Hotels, { foreignKey: 'hotelId', as: 'hotel' });
};

module.exports = RepeatCustomer;
