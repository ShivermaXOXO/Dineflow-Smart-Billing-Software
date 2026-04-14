const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Hotel = sequelize.define('Hotel', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false
    },
    name: DataTypes.STRING,
    status: DataTypes.STRING,
    tablenumber: DataTypes.INTEGER,
    address: DataTypes.TEXT,
    profileimage: DataTypes.TEXT,
    email: DataTypes.TEXT,
    password: DataTypes.TEXT
}, {
    tableName: 'hotels',
    schema: 'public',
    freezeTableName: true,
    timestamps: false
});

module.exports = Hotel;