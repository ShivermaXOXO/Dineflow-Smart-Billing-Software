const express = require('express');
const net = require('net');
const router = express.Router();

// Network printing endpoint
router.post('/network', async (req, res) => {
  const { ip, port, data } = req.body;

  try {
    await sendToNetworkPrinter(ip, port, data);
    res.json({ success: true, message: 'Printed successfully' });
  } catch (error) {
    console.error('Network printing error:', error);
    res.status(500).json({ success: false, error: 'Printing failed' });
  }
});

function sendToNetworkPrinter(ip, port, dataArray) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    const timeout = 5000; // 5 seconds timeout

    const timer = setTimeout(() => {
      client.destroy();
      reject(new Error('Connection timeout'));
    }, timeout);

    client.connect(port, ip, () => {
      clearTimeout(timer);
      
      const buffer = Buffer.from(dataArray);
      client.write(buffer, (err) => {
        if (err) {
          reject(err);
        } else {
          setTimeout(() => {
            client.destroy();
            resolve();
          }, 1000);
        }
      });
    });

    client.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    client.on('close', () => {
      clearTimeout(timer);
    });
  });
}

module.exports = router;