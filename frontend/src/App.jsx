import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/user/Home";
import Menu from "./pages/user/Menu";
import Offers from "./pages/user/Offers";
import Contact from "./pages/user/Contact";
import Cart from "./pages/user/Cart";
import Checkout from "./pages/user/Checkout";
import Login from "./pages/user/Login";
import Signup from "./pages/user/Signup";
import Profile from "./pages/user/Profile";
import Orders from "./pages/user/Orders";
import ForgotPassword from "./pages/user/ForgotPassword";
import RestaurantRegister from "./pages/restaurant/RestaurantRegister";
import RestaurantLogin from "./pages/restaurant/Login";
import RestaurantForgotPassword from "./pages/restaurant/ForgotPassword";
import RestaurantLayout from "./pages/restaurant/RestaurantLayout";
import { RestaurantAuthProvider } from "./context/RestaurantAuthContext";
import DeliveryRegister from "./pages/delivery/DeliveryRegister";
import DeliveryLogin from "./pages/delivery/Login";
import DeliveryForgotPassword from "./pages/delivery/ForgotPassword";
import DeliveryLayout from "./pages/delivery/DeliveryLayout";
import AdminSignup from "./pages/admin/AdminSignup";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminForgotPassword from "./pages/admin/ForgotPassword";
import Admin from "./pages/admin/Admin";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { UserAuthProvider } from "./context/UserAuthContext";
import { DeliveryAuthProvider } from "./context/DeliveryAuthContext";
import './App.css'
import { Toaster } from 'react-hot-toast';

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isDeliveryPage = location.pathname.startsWith('/delivery');
  const isRestaurantPage = location.pathname.startsWith('/restaurant');
  const isDeliveryAuthPage = location.pathname === '/delivery/login' || location.pathname === '/delivery/register' || location.pathname === '/delivery/forgot-password';
  const isRestaurantAuthPage = location.pathname === '/restaurant/login' || location.pathname === '/restaurant/register' || location.pathname === '/restaurant/forgot-password';
  const isUserAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password';
  const isAdminAuthPage = location.pathname === '/admin/login' || location.pathname === '/admin/signup' || location.pathname === '/admin/forgot-password';
  const showNavbar = (!isDeliveryPage && !isRestaurantPage) || isDeliveryAuthPage || isRestaurantAuthPage || isUserAuthPage || isAdminAuthPage;
  
  return (
    <div className="App">
      {showNavbar && <Navbar />}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2000,
          style: { color: '#ffffff' },
          success: { style: { background: '#16a34a' } },
          error: { style: { background: '#dc2626' } }
        }}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cart" element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        } />
        <Route path="/checkout" element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/restaurant/register" element={<RestaurantRegister />} />
        <Route path="/restaurant/login" element={<RestaurantLogin />} />
        <Route path="/restaurant/forgot-password" element={<RestaurantForgotPassword />} />
        <Route path="/restaurant/*" element={<RestaurantLayout />} />
        <Route path="/delivery/register" element={<DeliveryRegister />} />
        <Route path="/delivery/login" element={<DeliveryLogin />} />
        <Route path="/delivery/forgot-password" element={<DeliveryForgotPassword />} />
        <Route path="/delivery/*" element={<DeliveryLayout />} />
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
        <Route path="/admin" element={<Admin />} />

      </Routes>
      {!isAdminPage && !isDeliveryPage && !isRestaurantPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <UserAuthProvider>
      <AdminAuthProvider>
        <RestaurantAuthProvider>
          <DeliveryAuthProvider>
            <Router>
              <AppContent />
            </Router>
          </DeliveryAuthProvider>
        </RestaurantAuthProvider>
      </AdminAuthProvider>
    </UserAuthProvider>
  );
}

export default App;
