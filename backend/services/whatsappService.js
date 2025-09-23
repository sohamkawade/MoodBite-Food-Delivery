const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

let client;
let isReady = false;
let lastQr = '';

function getClient() {
  if (client) return client;
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    restartOnAuthFail: true,
    puppeteer: {
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']
    },
    webVersionCache: {
      type: 'remote',
      remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1027426813.html'
    }
  });

  client.on('qr', (qr) => {
    lastQr = qr;
    try { qrcode.generate(qr, { small: true }); } catch (e) {}
  });

  client.on('ready', () => {
    isReady = true;
  });

  client.on('disconnected', () => {
    isReady = false;
  });

  client.initialize().catch(() => {
    setTimeout(() => {
      try { client.initialize(); } catch (_) {}
    }, 1500);
  });
  return client;
}

async function ensureReady() {
  getClient();
  if (isReady) return true;
  // wait up to 60s for ready
  const start = Date.now();
  while (!isReady && Date.now() - start < 60000) {
    await new Promise(r => setTimeout(r, 1000));
  }
  return isReady;
}

async function sendWhatsAppMessage(number, message) {
  await ensureReady();
  if (!isReady) throw new Error('WhatsApp not ready');
  const formatted = number.includes('@c.us') ? number : `${number}@c.us`;
  return client.sendMessage(formatted, message);
}

function getQr() {
  return lastQr;
}

function getStatus() {
  return { isReady, hasQr: !!lastQr };
}

async function logoutAndReset() {
  try {
    if (client) {
      try { await client.logout(); } catch (e) {}
      try { await client.destroy(); } catch (e) {}
    }
  } finally {
    client = undefined;
    isReady = false;
    lastQr = '';
    try { fs.rmSync('./.wwebjs_auth', { recursive: true, force: true }); } catch (e) {}
  }
  getClient();
  return true;
}

module.exports = { getClient, ensureReady, sendWhatsAppMessage, getQr, getStatus, logoutAndReset };


