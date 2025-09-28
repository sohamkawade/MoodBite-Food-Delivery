# 🍽️ MoodBite - Food Delivery Platform

A full-stack food delivery application with React.js frontend and Node.js/Express.js backend, featuring multi-role authentication, real-time order management, and payment integration.

## 🌟 Features

**Multi-Role System**: Customers, Restaurants, Delivery Partners, Admin
**Core Features**: Menu management, shopping cart, order processing, payment integration (Razorpay + COD), delivery tracking with OTP verification, rating system
**Financial**: Automatic payment distribution, balance management, transaction history
**Security**: JWT authentication, role-based access control, password reset, data validation

## 🏗️ Tech Stack

**Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, Razorpay, bcryptjs, Helmet
**Frontend**: React.js, Vite, React Router, Tailwind CSS, Axios, React Hot Toast

## 🚀 Quick Start

### Prerequisites
- Node.js (v18.0.0+)
- MongoDB
- Git

### Installation

1. **Clone & Install**
   ```bash
   git clone <repository-url>
   cd MoodBite
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Environment Setup**
   Create `.env` in backend directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/moodbite
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   CORS_ORIGIN=http://localhost:5173
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

3. **Start Application**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend  
   cd frontend && npm run dev
   ```

**Access**: Frontend (http://localhost:5173) | Backend (http://localhost:5000)

## 📱 User Roles

**👤 Customers**: Browse menu, place orders, track deliveries, manage profile, loyalty program
**🏪 Restaurants**: Manage menu, process orders, track earnings, bank details
**🚚 Delivery**: Accept orders, update status, OTP verification, earnings tracking
**👨‍💼 Admin**: Platform management, user management, analytics, order monitoring

## 🔧 Key API Endpoints

**Authentication**: `/api/users/signup`, `/api/users/login`, `/api/restaurant/login`, `/api/delivery/login`, `/api/admin/login`
**Orders**: `/api/orders/place`, `/api/orders`, `/api/orders/:id`, `/api/orders/:id/cancel`
**Menu**: `/api/menu/items`, `/api/menu/trending`, `/api/menu/new-arrivals`
**Cart**: `/api/cart`, `/api/cart/add`, `/api/cart/update`, `/api/cart/remove/:id`

## 📊 Database Models

**User**: Customer info, preferences, loyalty data
**Restaurant**: Details, menu, operating hours, bank info
**MenuItem**: Food items, pricing, categories, availability
**Order**: Order details, status, payment info
**DeliveryBoy**: Partner info, status, earnings
**Transaction**: Financial records
**Rating**: Reviews and ratings

## 🚀 Deployment

**Backend (Render)**: Connect repo, set env variables, deploy
**Frontend (Vercel/Netlify)**: Connect repo, build command: `npm run build`, output: `dist`

------------------------------------------------------------------------------------------------------

**MoodBite** - *Good food. Good mood.* 🍽️✨
