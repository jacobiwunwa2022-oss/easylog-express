const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// SUPABASE CONNECTION
const supabase = createClient(
  "https://zssdeapmesedzilrueoh.supabase.co",
  "sb_publishable_0vfHP85fYWtABokdLdMixw_whCKG0UR"
);

// HOME PAGE (DHL STYLE)
app.get("/", (req, res) => {
  res.send(`
  <style>
    body { margin:0; font-family:Arial; }
    header { background:#ffcc00; padding:15px; font-weight:bold; }
    .hero { background:black; color:white; padding:40px; text-align:center; }
    input,button { padding:12px; margin:5px; width:200px; }
    button { background:#ffcc00; border:none; font-weight:bold; }
  </style>

  <header>EasyLog Express</header>

  <div class="hero">
    <h1>Fast & Reliable Delivery</h1>

    <input id="sender" placeholder="Sender">
    <input id="receiver" placeholder="Receiver"><br>

    <button onclick="pay()">Pay & Create Shipment</button><br><br>

    <input id="trackId" placeholder="Tracking ID">
    <button onclick="track()">Track</button>
  </div>

  <script src="https://js.paystack.co/v1/inline.js"></script>

  <script>
  function pay() {
    let handler = PaystackPop.setup({
      key: 'pk_test_xxxxxxxx', // replace later
      email: "customer@email.com",
      amount: 500000,
      callback: function(response) {
        createShipment();
      }
    });
    handler.openIframe();
  }

  function createShipment() {
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
      alert("Tracking ID: " + data.id);
    });
  }

  function track() {
    window.location = "/track/" + trackId.value;
  }
  </script>
  `);
});


// CREATE SHIPMENT
app.post("/create", async (req, res) => {
  const id = "ELX-" + Date.now();

  await supabase.from("shipments").insert([{
    tracking_id: id,
    sender: req.body.sender,
    receiver: req.body.receiver,
    status: "Pending",
    lat: 6.5244,
    lng: 3.3792
  }]);

  res.json({ id });
});


// TRACK PAGE WITH MAP
app.get("/track/:id", async (req, res) => {
  const { data } = await supabase
    .from("shipments")
    .select("*")
    .eq("tracking_id", req.params.id)
    .single();

  if (!data) return res.send("Not found");

  res.send(`
    <h1>${data.tracking_id}</h1>
    <h2>Status: ${data.status}</h2>

    <div id="map" style="height:300px;"></div>

    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>

    <script>
      var map = L.map('map').setView([${data.lat}, ${data.lng}], 6);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
        .addTo(map);

      L.marker([${data.lat}, ${data.lng}])
        .addTo(map)
        .bindPopup("Package Location")
        .openPopup();
    </script>

    <br>
    <a href="/receipt/${data.tracking_id}">Download Receipt</a>
  `);
});


// ADMIN UPDATE
app.post("/update/:id", async (req, res) => {
  await supabase
    .from("shipments")
    .update({
      status: req.body.status,
      lat: req.body.lat,
      lng: req.body.lng
    })
    .eq("tracking_id", req.params.id);

  res.send("Updated");
});


// RECEIPT
app.get("/receipt/:id", async (req, res) => {
  const { data } = await supabase
    .from("shipments")
    .select("*")
    .eq("tracking_id", req.params.id)
    .single();

  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);
  doc.fontSize(20).text("EasyLog Express");
  doc.text("Tracking ID: " + data.tracking_id);
  doc.text("Sender: " + data.sender);
  doc.text("Receiver: " + data.receiver);
  doc.text("Status: " + data.status);
  doc.end();
});


app.listen(3000, () => console.log("Running..."));
