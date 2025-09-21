const crypto = require('crypto');
const { handlePayoutWebhook } = require('../services/paymentDistributionService');

/**
 * Handle Razorpay webhooks
 */
const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
    
    const { event, contains, payload } = req.body;
    
    // Handle payout webhooks
    if (event === 'payout.processed' || event === 'payout.failed') {
      const result = await handlePayoutWebhook(req.body);
      
      if (result.success) {
        console.log(`Payout webhook processed: ${event}`, result.payoutRecord?._id);
        return res.json({ success: true, message: 'Webhook processed successfully' });
      } else {
        console.error('Payout webhook processing failed:', result.error);
        return res.status(500).json({ success: false, message: 'Webhook processing failed' });
      }
    }
    
    // Handle other webhook events if needed
    console.log('Webhook received:', event);
    res.json({ success: true, message: 'Webhook received' });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

module.exports = {
  handleRazorpayWebhook
};
