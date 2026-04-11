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

    <script>
      function create() {
        fetch('/create', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            sender: sender.value,
            receiver: receiver.value
          })
        })
        .then(res=>res.json())
        .then(data=>{
          result.innerHTML = "Tracking ID: " + data.id;
        });
      }

      function track() {
        window.location = "/track/" + trackId.value;
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
    status: "Pending"
  };

  res.json({ id });
});

// TRACK
app.get("/track/:id", (req, res) => {
  const s = shipments[req.params.id];
  if (!s) return res.send("Not found");

  res.send(`
    <h1>Tracking ${req.params.id}</h1>
    <h2>Status: ${s.status}</h2>
  `);
});

// RECEIPT
app.get("/receipt/:id", (req, res) => {
  const s = shipments[req.params.id];
  if (!s) return res.send("Not found");

  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);
  doc.fontSize(20).text("EasyLog Express Receipt");
  doc.text("Tracking ID: " + req.params.id);
  doc.text("Sender: " + s.sender);
  doc.text("Receiver: " + s.receiver);
  doc.end();
});

app.listen(3000, () => console.log("Running..."));
