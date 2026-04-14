require('dotenv').config();
const { Sequelize } = require('sequelize');

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const databaseUrl =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: process.env.NODE_ENV === 'production'
    ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
      }
    : {},
});

sequelize.authenticate()
  .then(() => console.log('✅ PostgreSQL Connected'))
  .catch(err => console.error('❌ DB Error:', err));

sequelize.query('select * from public.hotels', { raw: true })
  .then(([rows]) => console.log("RAW HOTELS:", rows))
  .catch(err => console.error("RAW SQL ERROR:", err));
module.exports = sequelize;