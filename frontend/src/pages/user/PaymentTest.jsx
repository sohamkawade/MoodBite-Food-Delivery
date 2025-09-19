import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../../services/api';
import { useUserAuth } from '../../context/UserAuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const PaymentTest = () => {
  const { isUserLoggedIn, user } = useUserAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [testAmount, setTestAmount] = useState(1);

  useEffect(() => {
    if (!isUserLoggedIn) {
      toast.error('Please login to test payments');
      navigate('/login');
    }
  }, [isUserLoggedIn, navigate]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  const handleTestPayment = async () => {
    if (!razorpayLoaded) {
      toast.error('Razorpay is still loading, please wait...');
      return;
    }
    setLoading(true);
    try {
      const orderResponse = await paymentAPI.createRazorpayOrder(testAmount, `payment_${Date.now()}`);
      if (!orderResponse.success) throw new Error(orderResponse.message);

      const { id, amount, currency, key } = orderResponse.data;

      const options = {
        key,
        amount,
        currency,
        name: 'MoodBite',
        description: `Real Payment of ₹${testAmount}`,
        order_id: id,
        handler: async (response) => {
          const verifyResponse = await paymentAPI.verifyRazorpayPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
          if (verifyResponse.success) {
            toast.success(`Payment ₹${testAmount} successful!`);
          } else {
            toast.error('Payment verification failed');
          }
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
      toast.error('Payment initiation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen backcolor flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-800">💳 Test Real Payment</h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Important Information:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>This will process a <strong>real payment</strong> via Razorpay.</li>
            <li>Money will be deducted from your UPI/Card/Wallet.</li>
            <li>Minimum test amount is ₹1.</li>
            <li>You’ll get a real payment confirmation after success.</li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
          <input
            type="number"
            value={testAmount}
            onChange={(e) => setTestAmount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full border rounded-lg px-3 py-2 text-center"
            min="1"
          />
        </div>

        <button
          onClick={handleTestPayment}
          disabled={loading || !razorpayLoaded}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
            loading || !razorpayLoaded
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          {loading ? 'Processing...' : `Pay ₹${testAmount}`}
        </button>

        {!razorpayLoaded && (
          <p className="text-center text-sm text-gray-500">Loading Razorpay...</p>
        )}

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-700 text-center">
          ⚠️ This is a <strong>real payment</strong>. Please use a valid UPI, card, or wallet.
        </div>
      </div>
    </div>
  );
};

export default PaymentTest;
