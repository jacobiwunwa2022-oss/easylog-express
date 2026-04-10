const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Fake database (in-memory)
let shipments = {};

// Generate tracking number
function generateTracking() {
  return "ELX" + Math.floor(100000000 + Math.random() * 900000000);
}

// CREATE SHIPMENT
app.post("/create-shipment", (req, res) => {
  const tracking = generateTracking();

  const shipment = {
    tracking,
    sender: req.body.sender,
    receiver: req.body.receiver,
    origin: req.body.origin,
    destination: req.body.destination,
    status: "Processing",
    created: new Date()
  };

  shipments[tracking] = shipment;

  res.json({ success: true, tracking });
});

// TRACK SHIPMENT
app.get("/track/:id", (req, res) => {
  const data = shipments[req.params.id];

  if (!data) {
    return res.json({ success: false, message: "Tracking not found" });
  }

  res.json({ success: true, shipment: data });
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("EasyLog Express running on port " + PORT));
