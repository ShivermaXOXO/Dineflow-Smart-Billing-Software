require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http')
const sequelize = require('./config/db');
const cors = require('cors');
const path = require('path');
const initSocket = require('./config/socket.js');
const host = process.env.HOST || '0.0.0.0';

//require('dotenv').config();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('DineFlow Backend Running');
});

// socket.io implementation
const server = http.createServer(app);
initSocket(server);

const multer= require('multer');
const fs=   require('fs');

const Staff = require('./models/Staff');
const Bill = require('./models/Bill');
const Inventory = require('./models/Inventory');
const Order = require('./models/Order');
const Product = require('./models/Product');
const Hotels = require('./models/Hotels');
const RepeatCustomer = require('./models/RepeatCustomer');
// Add this with other route imports at the top
const printRoutes = require('./routes/printRoutes');
const qrOrders = require('./routes/qrOrders');
// Add this with other route middleware (around line 50-60)

// Setup associations
Staff.associate?.({ Bill, Order });
Bill.associate?.({ Staff });
Order.associate?.({ Staff });
RepeatCustomer.associate?.({ Hotels });
Hotels.hasMany(Product, { foreignKey: 'hotelId' });
Product.belongsTo(Hotels, { foreignKey: 'hotelId' });

// Middleware 
app.use(express.json());



// CORS configuration with environment variables
const corsOrigins = process.env.CORS_ORIGINS ? 
  process.env.CORS_ORIGINS.split(',') : 
  ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'];

app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const hotelRoutes = require('./routes/hotelRoutes');
const staffRoutes = require('./routes/StaffRoutes');
const counterRoutes = require('./routes/StaffRoutes');
const productRoute = require('./routes/ProductRoutes');
const billRoute = require('./routes/BillRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const repeatCustomerRoutes = require('./routes/repeatCustomerRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const qrRoutes = require("./routes/qrRoutes");

app.use("/api", qrRoutes);


app.use('/api/hotels', hotelRoutes);
app.use('/api/staff', staffRoutes);
app.use('api/counter', staffRoutes); // Reuse staff routes for counter role
app.use('/api/product', productRoute);
app.use('/api/bill', billRoute);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/repeat-customers', repeatCustomerRoutes);
app.use('/api/print', printRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/qrorders', qrOrders);

// Test DB connection, sync models, and start server
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully.');

        await sequelize.sync(); // optional, remove later in production
        console.log('🔄 Tables synced');

        server.listen(port, host, () => {
            console.log(` Server running on port ${port}`);
        });
    } catch (err) {
        console.error(' Unable to connect to the database:', err);
    }
}

startServer();