import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../../services/api';
import { useUserAuth } from '../../context/UserAuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { loadRazorpayScript } from '../../utils/razorpayLoader';

const PaymentTest = () => {
  const { isUserLoggedIn, user } = useUserAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [amount, setAmount] = useState(1);

  useEffect(() => {
    if (!isUserLoggedIn) {
      toast.error('Please login to continue');
      navigate('/login');
    }
  }, [isUserLoggedIn, navigate]);

  useEffect(() => {
    loadRazorpayScript()
      .then(() => setRazorpayLoaded(true))
      .catch(() => toast.error('Failed to load payment gateway. Please try again.'));
  }, []);

  const handlePayment = async () => {
    if (!razorpayLoaded) return toast.error('Payment gateway is loading, please wait...');
    setLoading(true);

    try {
      const order = await paymentAPI.createRazorpayOrder(amount, `order_${Date.now()}`);
      if (!order.success) throw new Error(order.message);

      const { id, currency, key } = order.data;

      const options = {
        key,
        amount: amount * 100,
        currency,
        name: 'MoodBite',
        description: `Payment of ₹${amount}`,
        order_id: id,
        handler: async (res) => {
          const verify = await paymentAPI.verifyRazorpayPayment(
            res.razorpay_order_id,
            res.razorpay_payment_id,
            res.razorpay_signature
          );
          verify.success
            ? toast.success(`Payment of ₹${amount} completed successfully`)
            : toast.error('Payment verification failed. Please contact support.');
        },
        prefill: {
          name: user?.firstName || 'User',
          email: user?.email || 'user@moodbite.com',
          contact: user?.phone || '9999999999'
        },
        theme: { color: '#f97316' }
      };

      new window.Razorpay(options).open();
    } catch (err) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen backcolor flex items-center justify-center px-4 bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-sm space-y-5">
        <h1 className="text-xl font-bold text-center text-gray-800">Test Payment Page</h1>

        <div className="bg-red-50 border border-red-400 rounded-md p-3 text-sm text-red-800 text-center font-semibold">
          ⚠️ Warning: This is a real payment page created for testing by the developer.  
          Any payment you make here <strong>will be charged immediately</strong>. Only proceed if you understand this.
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full border rounded-lg px-3 py-2 text-center"
            min="1"
          />
        </div>

        <button
          onClick={handlePayment}
          disabled={loading || !razorpayLoaded}
          className={`w-full py-2 rounded-lg font-semibold text-white transition-all ${
            loading || !razorpayLoaded
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          {loading ? 'Processing...' : `Pay ₹${amount} Now`}
        </button>

        <p className="text-xs text-gray-500 text-center">
          For support or questions, contact support@moodbite.com
        </p>
      </div>
    </div>
  );
};

export default PaymentTest;
