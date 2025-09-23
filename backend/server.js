const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const envPath = path.join(__dirname, '.env');

require('dotenv').config({ path: envPath });

const db = require('./config/db');
const { expireOnlineStatus } = require('./utils/expireOnlineStatus');

const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const menuRoutes = require('./routes/menuRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const deliveryBoyRoutes = require('./routes/deliveryBoyRoutes');
const deliveryAuthRoutes = require('./routes/deliveryAuthRoutes');
const restaurantAuthRoutes = require('./routes/restaurantAuthRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
 
 

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: [
          "'self'",
          'http://localhost:5000',
          'https://moodbite-food-delivery.onrender.com',
          'https://api.razorpay.com',
          'https://*.razorpay.com',
          'https://checkout.razorpay.com'
        ],
        scriptSrc: [
          "'self'", 
          "'wasm-unsafe-eval'",
          'https://checkout.razorpay.com',
          'https://*.razorpay.com'
        ],
        workerSrc: ["'self'", 'blob:'],
        imgSrc: [
          "'self'", 
          'data:', 
          'blob:', 
          'https:', 
          'http:',
          'https://*.razorpay.com'
        ],
        styleSrc: [
          "'self'", 
          "'unsafe-inline'",
          'https://checkout.razorpay.com',
          'https://*.razorpay.com'
        ],
        frameSrc: [
          "'self'",
          'https://checkout.razorpay.com',
          'https://*.razorpay.com'
        ],
      }
    }
  })
);

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const { getServiceStatus } = require('./utils/emailService');
  
  res.status(200).json({ 
    status: 'OK', 
    message: 'MoodBite API is running',
    timestamp: new Date().toISOString(),
    services: {
      sms: getServiceStatus()
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      corsOrigin: process.env.CORS_ORIGIN
    }
  });
});

app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/delivery-boys', deliveryBoyRoutes);
app.use('/api/delivery', deliveryAuthRoutes);
app.use('/api/restaurant', restaurantAuthRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/whatsapp', whatsappRoutes);
 
 

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // or your frontend URL
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Expose-Headers", "x-rtb-fingerprint-id"); 
  next();
});


app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});


app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("MoodBite Server is running on PORT:", PORT);
});

db.once('open', () => {
  expireOnlineStatus().catch((error) => {
    console.error('Failed to expire online status (initial):', error);
  });

  setInterval(async () => {
    try {
      await expireOnlineStatus();
    } catch (error) {
      console.error('Failed to expire online status:', error);
    }
  }, 60 * 60 * 1000);
});

module.exports = app;
