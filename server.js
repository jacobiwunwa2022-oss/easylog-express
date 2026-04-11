const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");

const app = express();
app.use(cors());
app.use(express.json());

let shipments = {};

// GENERATE PROFESSIONAL TRACKING ID
function generateID() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let part1 = "", part2 = "";

  for (let i = 0; i < 4; i++) {
    part1 += chars[Math.floor(Math.random() * chars.length)];
    part2 += chars[Math.floor(Math.random() * chars.length)];
  }

  return `ELX-${new Date().getFullYear()}-${part1}-${part2}`;
}

// 🏠 HOME (DHL STYLE)
app.get("/", (req, res) => {
  res.send(`
  <html>
  <head>
    <title>EasyLog Express</title>
    <style>
      body { margin:0; font-family:Arial; background:#f4f4f4; }
      header { background:#ffcc00; padding:15px; font-size:22px; font-weight:bold; }
      .hero { background:black; color:white; padding:60px; text-align:center; }
      .box { background:white; padding:20px; margin:20px auto; width:90%; max-width:400px; border-radius:10px; }
      input,button { width:100%; padding:12px; margin:6px 0; }
      button { background:#ffcc00; border:none; font-weight:bold; cursor:pointer; }
    </style>
  </head>

  <body>
    <header>EasyLog Express</header>

    <div class="hero">
      <h1>Fast & Secure Delivery</h1>
      <p>Ship & Track globally</p>
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
      <button onclick="track()">Track</button>
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
  </body>
  </html>
  `);
});

// CREATE SHIPMENT
app.post("/create", (req, res) => {
  const id = generateID();

  shipments[id] = {
    sender: req.body.sender,
    receiver: req.body.receiver,
    status: "Processing",
    lat: 6.5244,
    lng: 3.3792
  };

  res.json({ id });
});

// TRACK PAGE WITH MAP
app.get("/track/:id", (req, res) => {
  const s = shipments[req.params.id];
  if (!s) return res.send("Shipment not found");

  res.send(`
  <h1>${req.params.id}</h1>
  <h2>Status: ${s.status}</h2>

  <div id="map" style="height:300px;"></div>

  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

  <script>
    var map = L.map('map').setView([${s.lat}, ${s.lng}], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
      .addTo(map);

    L.marker([${s.lat}, ${s.lng}]).addTo(map);
  </script>

  <br>
  <a href="/receipt/${req.params.id}">Download Receipt</a>
  `);
});

// ADMIN PANEL
app.get("/admin", (req, res) => {
  res.send(`
    <h1>Admin Panel</h1>

    <input id="id" placeholder="Tracking ID">
    <input id="status" placeholder="Status">
    <input id="lat" placeholder="Latitude">
    <input id="lng" placeholder="Longitude">

    <button onclick="update()">Update</button>

    <script>
      function update() {
        fetch('/update/' + id.value, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            status: status.value,
            lat: lat.value,
            lng: lng.value
          })
        }).then(()=>alert("Updated"));
      }
    </script>
  `);
});

// UPDATE
app.post("/update/:id", (req, res) => {
  if (!shipments[req.params.id]) return res.send("Not found");

  shipments[req.params.id].status = req.body.status;
  shipments[req.params.id].lat = req.body.lat;
  shipments[req.params.id].lng = req.body.lng;

  res.send("Updated");
});

// RECEIPT
app.get("/receipt/:id", (req, res) => {
  const s = shipments[req.params.id];
  if (!s) return res.send("Not found");

  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);
  doc.fontSize(20).text("EasyLog Express");
  doc.text("Tracking ID: " + req.params.id);
  doc.text("Sender: " + s.sender);
  doc.text("Receiver: " + s.receiver);
  doc.text("Status: " + s.status);
  doc.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));
