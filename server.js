const express = require("express");
const cors = require("cors");
const fs = require("fs");
const PDFDocument = require("pdfkit");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = "data.json";

// LOAD DATA
let shipments = {};
if (fs.existsSync(DATA_FILE)) {
  shipments = JSON.parse(fs.readFileSync(DATA_FILE));
}

// SAVE DATA
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(shipments, null, 2));
}

// HOME
app.get("/", (req, res) => {
  res.send(`
    <style>
      body { font-family: Arial; text-align:center; }
      h1 { background:#ffcc00; padding:10px; }
      input,button { padding:10px; margin:5px; }
    </style>

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

// CREATE
app.post("/create", (req, res) => {
  const id = "ELX-" + Date.now();

  shipments[id] = {
    sender: req.body.sender,
    receiver: req.body.receiver,
    status: "Pending",
    location: { lat: 6.5244, lng: 3.3792 },
    history: [{ status: "Pending", time: new Date() }]
  };

  saveData();

  res.json({ id });
});

// TRACK PAGE
app.get("/track/:id", (req, res) => {
  const s = shipments[req.params.id];
  if (!s) return res.send("Not found");

  res.send(`
    <h1>Tracking ${req.params.id}</h1>
    <h2>Status: ${s.status}</h2>

    <div id="map" style="height:300px;"></div>

    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

    <script>
      var map = L.map('map').setView([${s.location.lat}, ${s.location.lng}], 6);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
        .addTo(map);

      L.marker([${s.location.lat}, ${s.location.lng}])
        .addTo(map)
        .bindPopup("Package Location")
        .openPopup();
    </script>

    <br>
    <a href="/receipt/${req.params.id}">Download Receipt</a>
  `);
});

// ADMIN
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
        })
      }
    </script>
  `);
});

// UPDATE
app.post("/update/:id", (req, res) => {
  const s = shipments[req.params.id];
  if (!s) return res.send("Not found");

  s.status = req.body.status;

  if (req.body.lat && req.body.lng) {
    s.location = {
      lat: req.body.lat,
      lng: req.body.lng
    };
  }

  s.history.push({
    status: req.body.status,
    time: new Date()
  });

  saveData();

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

app.listen(3000, () => console.log("Running..."));
