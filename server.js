const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));
let database = {};

function generateTracking() {
  return 'ELX' + Math.floor(100000000 + Math.random() * 900000000);
}

// Create shipment
app.post('/create', (req, res) => {
  const tracking = generateTracking();

  database[tracking] = {
    sender: req.body.sender,
    receiver: req.body.receiver,
    status: 'Shipment created',
  };

  res.json({ tracking });
});

// Track shipment
app.get('/track/:id', (req, res) => {
  res.json(database[req.params.id] || { error: 'Not found' });
});

// Homepage
app.get('/', (req, res) => {
  res.send(`
    <h1>EasyLog Express</h1>
    <p>Delivery system is running</p>
  `);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
});
