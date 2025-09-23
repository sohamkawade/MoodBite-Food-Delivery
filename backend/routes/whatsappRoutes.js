const express = require('express');
const router = express.Router();
const { getQr, getStatus, sendWhatsAppMessage, getClient, logoutAndReset } = require('../services/whatsappService');

// ensure client starts
getClient();

router.get('/status', (req, res) => {
  res.json({ success: true, data: getStatus() });
});

router.get('/qr', (req, res) => {
  const qr = getQr();
  if (!qr) return res.status(404).json({ success: false, message: 'QR not available yet' });
  res.json({ success: true, data: { qr } });
});

router.post('/reset-qr', async (req, res) => {
  try {
    await logoutAndReset();
    return res.json({ success: true });
  } catch (e) {
    console.error('QR reset error:', e);
    return res.status(500).json({ success: false, message: 'failed to reset QR' });
  }
});

router.post('/send', async (req, res) => {
  try {
    const { number, message } = req.body;
    if (!number || !message) return res.status(400).json({ success: false, message: 'number and message required' });
    await sendWhatsAppMessage(number, message);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || 'failed to send' });
  }
});

module.exports = router;


