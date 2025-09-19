const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? "https://moodbite-food-delivery.onrender.com/api"
  : "http://localhost:5000/api";

const testAmount = 1;
const testReceipt = `test_receipt_${Date.now()}`;

async function testRazorpayPayment() {
  try {
    const createOrderResponse = await fetch(`${API_BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: testAmount, receipt: testReceipt })
    });

    const createOrderData = await createOrderResponse.json();
    if (!createOrderResponse.ok) return;

    const mockPaymentData = {
      razorpay_order_id: createOrderData.data.id,
      razorpay_payment_id: `pay_test_${Date.now()}`,
      razorpay_signature: 'mock_signature_for_testing'
    };

    const verifyResponse = await fetch(`${API_BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockPaymentData)
    });

    await verifyResponse.json();
  } catch (error) {}
}

testRazorpayPayment();
