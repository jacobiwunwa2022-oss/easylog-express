const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

let shipments = {};

// CREATE SHIPMENT
app.post("/shipment/create", (req, res) => {
  const id = "ELX-" + Date.now();

  shipments[id] = {
    ...req.body,
    status: "Pending",
    history: [{ status: "Pending", time: new Date() }]
  };

  res.json({ trackingId: id });
});

// TRACK SHIPMENT
app.get("/shipment/:id", (req, res) => {
  const shipment = shipments[req.params.id];
  if (!shipment) return res.json({ message: "Not found" });
  res.json(shipment);
});

// UPDATE STATUS (ADMIN)
app.post("/admin/update/:id", (req, res) => {
  const shipment = shipments[req.params.id];
  if (!shipment) return res.json({ message: "Not found" });

  shipment.status = req.body.status;
  shipment.history.push({
    status: req.body.status,
    time: new Date()
  });

  res.json({ message: "Updated" });
});

// ADMIN LOGIN
app.post("/admin/login", (req, res) => {
  if (req.body.username === "admin" && req.body.password === "1234") {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// RECEIPT PDF
app.get("/receipt/:id", (req, res) => {
  const shipment = shipments[req.params.id];
  if (!shipment) return res.send("Not found");

  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);

  doc.fontSize(20).text("EasyLog Express Receipt");
  doc.moveDown();
  doc.text(`Tracking ID: ${req.params.id}`);
  doc.text(`Sender: ${shipment.sender}`);
  doc.text(`Receiver: ${shipment.receiver}`);
  doc.text(`Status: ${shipment.status}`);

  doc.end();
});

// START SERVER
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
