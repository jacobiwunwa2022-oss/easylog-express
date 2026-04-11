const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static("public"));

// REAL DATABASE (temporary memory storage)
let shipments = {};

// CREATE SHIPMENT
app.post("/api/create", (req, res) => {
  const tracking = "ELX" + Math.floor(100000000 + Math.random() * 900000000);

  shipments[tracking] = {
    tracking,
    sender: req.body.sender,
    receiver: req.body.receiver,
    origin: req.body.origin,
    destination: req.body.destination,
    status: "Processing"
  };

  res.json({ success: true, tracking });
});

// TRACK SHIPMENT
app.get("/api/track/:id", (req, res) => {
  const data = shipments[req.params.id];

  if (!data) {
    return res.json({ success: false, message: "Tracking not found" });
  }

  res.json({ success: true, shipment: data });
});

// ADMIN UPDATE STATUS
app.post("/api/update/:id", (req, res) => {
  const shipment = shipments[req.params.id];

  if (!shipment) {
    return res.json({ success: false });
  }

  shipment.status = req.body.status;

  res.json({ success: true, shipment });
});

const PORT = process.env.PORT || 3000;
app.post('/api/update', (req, res) => {
  const { tracking, status, location } = req.body;

  const shipment = shipments[tracking];

  if (!shipment) {
    return res.json({ success: false });
  }

  shipment.status = status;

  shipment.history.push({
    location,
    status,
    date: new Date().toLocaleString()
  });

  res.json({ success: true });
});
app.listen(PORT, () => {
  console.log("EasyLog upgraded running");
});
