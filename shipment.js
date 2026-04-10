const mongoose = require("mongoose");

const ShipmentSchema = new mongoose.Schema({
  trackingNumber: String,
  sender: String,
  receiver: String,
  origin: String,
  destination: String,
  status: {
    type: String,
    default: "Processing"
  },
  history: [
    {
      status: String,
      date: { type: Date, default: Date.now }
    }
  ],
  paid: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("Shipment", ShipmentSchema);
