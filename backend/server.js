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
const analyticsRoutes = require('./routes/analyticsRoutes');
const deliveryAuthRoutes = require('./routes/deliveryAuthRoutes');
const restaurantAuthRoutes = require('./routes/restaurantAuthRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

// Mongo connection is initialized in ./config/db (required above)
app.use(
  helmet({
    // Some browsers require disabling COEP for third-party WASM/CDN usage
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Allow API calls and WASM fetches to your backend and the Lottie CDNs
        connectSrc: [
          "'self'",
          'http://localhost:5000',
          'https://moodbite-food-delivery.onrender.com',
          'https://cdn.jsdelivr.net',
          'https://unpkg.com'
        ],
        // Enable WASM compilation in modern browsers while keeping eval disabled
        // Note: 'wasm-unsafe-eval' is supported by Chromium-based browsers
        scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
        workerSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        frameSrc: ["'self'"]
      }
    }
  })
);

app.use(cors({
  origin: [process.env.CORS_ORIGIN, 'http://localhost:5173'],
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
app.use('/api/analytics', analyticsRoutes);
app.use('/api/delivery', deliveryAuthRoutes);
app.use('/api/restaurant', restaurantAuthRoutes);
app.use('/api/ratings', ratingRoutes);


// --------------------------------------------------------
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});
// --------------------------------------------------------


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

// Start background jobs only after MongoDB connection is open
db.once('open', () => {
  // Initial run
  expireOnlineStatus().catch((error) => {
    console.error('Failed to expire online status (initial):', error);
  });

  // Schedule hourly runs
  setInterval(async () => {
    try {
      await expireOnlineStatus();
    } catch (error) {
      console.error('Failed to expire online status:', error);
    }
  }, 60 * 60 * 1000);
});

module.exports = app;
