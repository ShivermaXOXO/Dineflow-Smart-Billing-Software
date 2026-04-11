const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Hotel = sequelize.define(
    'Hotel',
    {
    id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
    },

    name: {
        type: DataTypes.STRING,
    },

        status: {
            type: DataTypes.STRING,
        },

        // 🔥 Important field for tables
        tablenumber: {
            type: DataTypes.INTEGER,
            field: 'tablenumber',
        },

    address: {
        type: DataTypes.TEXT,
    },

    profileimage: {
        type: DataTypes.TEXT,
    },

    email: {
        type: DataTypes.TEXT,
    },

    password: {
        type: DataTypes.TEXT,
        },
    },
    {
    tableName: 'hotels',
        freezeTableName: true,
    timestamps: false,
    }
);

module.exports = Hotel;
