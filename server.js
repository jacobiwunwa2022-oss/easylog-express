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

    <input id="sender" placeholder="Sender">
    <input id="receiver" placeholder="Receiver">
    <button onclick="create()">Create</button>

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
        .then(res => res.json())
        .then(data => alert(data.id));
      }
    </script>
  `);
});
  <style>
    body { margin:0; font-family:Arial; background:#f5f5f5; }

    header {
      background:#ffcc00;
      padding:15px;
      font-size:22px;
      font-weight:bold;
    }

    .hero {
      background:url('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7');
      background-size:cover;
      color:white;
      padding:80px 20px;
      text-align:center;
    }

    .box {
      background:white;
      padding:20px;
      margin:20px auto;
      width:90%;
      max-width:400px;
      border-radius:10px;
      box-shadow:0 0 10px rgba(0,0,0,0.1);
    }

    input,button {
      width:100%;
      padding:12px;
      margin:8px 0;
    }

    button {
      background:#ffcc00;
      border:none;
      font-weight:bold;
      cursor:pointer;
    }
  </style>

  <header>EasyLog Express</header>

  <div class="hero">
    <h1>Fast & Secure Global Delivery</h1>
    <p>Track your shipment in real time</p>
  </div>

  <div class="box">
    <h3>Create Shipment</h3>
    <input id="sender" placeholder="Sender">
    <input id="receiver" placeholder="Receiver">
    <button onclick="create()">Create Shipment</button>
    <p id="result"></p>
  </div>

  <div class="box">
    <h3>Track Shipment</h3>
    <input id="trackId" placeholder="Tracking ID">
    <button onclick="track()">Track Now</button>
  </div>

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
});) => {
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
  if (!s) return res.send("Shipment not found");

  res.send(`
  <h1>Tracking: ${req.params.id}</h1>
  <h2>Status: ${s.status}</h2>

  <div id="map" style="height:300px;"></div>

  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

  <script>
    var map = L.map('map').setView([6.5244, 3.3792], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
      .addTo(map);

    L.marker([6.5244, 3.3792])
      .addTo(map)
      .bindPopup("Package Location")
      .openPopup();
  </script>
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
