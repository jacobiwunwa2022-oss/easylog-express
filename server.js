const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");

const app = express();
app.use(cors());
app.use(express.json());

let shipments = {};

// HOME PAGE
app.get("/", (req, res) => {
  res.send(`
    <h1>EasyLog Express</h1>

    <h2>Create Shipment</h2>
    <input id="sender" placeholder="Sender">
    <input id="receiver" placeholder="Receiver">
    <button onclick="create()">Create</button>
    <p id="result"></p>

    <h2>Track Shipment</h2>
    <input id="trackId" placeholder="Tracking ID">
    <button onclick="track()">Track</button>
    <p id="output"></p>

    <script>
      function create() {
        fetch('/create', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            sender: sender.value,
            receiver: receiver.value
          })
        })
        .then(res => res.json())
        .then(data => {
          result.innerHTML = "Tracking ID: " + data.id;
        });
      }

      function track() {
        fetch('/track/' + trackId.value)
        .then(res => res.json())
        .then(data => {
          output.innerHTML = "Status: " + data.status;
        });
      }
    </script>
  `);
});

// CREATE SHIPMENT
app.post("/create", (req, res) => {
  const id = "ELX-" + Date.now();

  shipments[id] = {
    sender: req.body.sender,
    receiver: req.body.receiver,
    status: "Pending",
    history: [{ status: "Pending", time: new Date() }]
  };

  res.json({ id });
});

// TRACK
app.get("/track/:id", (req, res) => {
  const shipment = shipments[req.params.id];
  if (!shipment) return res.json({ status: "Not found" });

  res.json(shipment);
});

// ADMIN UPDATE
app.get("/admin", (req, res) => {
  res.send(`
    <h1>Admin Panel</h1>

    <input id="id" placeholder="Tracking ID">
    <input id="status" placeholder="New Status">
    <button onclick="update()">Update</button>

    <script>
      function update() {
        fetch('/update/' + id.value, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({status: status.value})
        })
      }
    </script>
  `);
});

app.post("/update/:id", (req, res) => {
  const shipment = shipments[req.params.id];
  if (!shipment) return res.send("Not found");

  shipment.status = req.body.status;
  shipment.history.push({
    status: req.body.status,
    time: new Date()
  });

  res.send("Updated");
});

// RECEIPT
app.get("/receipt/:id", (req, res) => {
  const shipment = shipments[req.params.id];
  if (!shipment) return res.send("Not found");

  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);
  doc.fontSize(20).text("EasyLog Express Receipt");
  doc.text("Tracking ID: " + req.params.id);
  doc.text("Sender: " + shipment.sender);
  doc.text("Receiver: " + shipment.receiver);
  doc.text("Status: " + shipment.status);
  doc.end();
});

// START SERVER
app.listen(3000, () => console.log("Running..."));
