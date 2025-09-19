const { spawn } = require('child_process');
const path = require('path');

const testFile = path.join(__dirname, 'test-razorpay-payment.js');

const child = spawn('node', [testFile], {
  stdio: 'inherit',
  cwd: __dirname
});

child.on('close', (code) => {});
child.on('error', (error) => {});
