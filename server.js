const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

let database = {};

function generateTracking() {
  return 'ELX' + Math.floor(100000000 + Math.random() * 900000000);
}

function generateReceipt() {
  return 'RCP' + Math.floor(100000 + Math.random() * 900000);
}

// Create shipment
app.post('/create', (req, res) => {
  const tracking = generateTracking();
  const receipt = generateReceipt();

  database[tracking] = {
    sender: req.body.sender,
    receiver: req.body.receiver,
    status: 'Shipment created',
    location: 'London, UK',
    receipt: receipt
  };

  res.json({ tracking, receipt });
});

// Track shipment
app.get('/track/:id', (req, res) => {
  res.json(database[req.params.id] || { error: 'Not found' });
});

// Admin update
app.post('/update', (req, res) => {
  const { tracking, status, location } = req.body;

  if (database[tracking]) {
    database[tracking].status = status;
    database[tracking].location = location;
    res.json({ message: 'Updated' });
  } else {
    res.json({ error: 'Tracking not found' });
  }
});

// Receipt
app.get('/receipt/:id', (req, res) => {
  const shipment = Object.values(database).find(s => s.receipt === req.params.id);

  if (!shipment) return res.send('Receipt not found');

  res.send(`
    <h1>EasyLog Express Receipt</h1>
    <p>Sender: ${shipment.sender}</p>
    <p>Receiver: ${shipment.receiver}</p>
    <p>Status: ${shipment.status}</p>
    <p>Location: ${shipment.location}</p>
    <p>Receipt ID: ${shipment.receipt}</p>
  `);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
});
