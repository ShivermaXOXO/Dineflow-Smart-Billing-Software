const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Staff = sequelize.define('Staff', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'staff',
  },
  hotelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'hotelId',
    references: {
      model: 'hotels',   // ✅ lowercase
      key: 'id'
    }
  }
}, {
  tableName: 'Staffs',
  freezeTableName: true,
  timestamps: true,
});

Staff.associate = (models) => {
  Staff.hasMany(models.Bill, { foreignKey: 'staffId' });
  if (models.Order) {
    Staff.hasMany(models.Order, { foreignKey: 'staffId', as: 'assignedOrders' });
  }
};

module.exports = Staff;
