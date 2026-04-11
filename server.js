const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ YOUR SUPABASE (ALREADY SET)
const supabase = createClient(
  "https://zssdeapmesedzilrueoh.supabase.co",
  "sb_publishable_0vfHP85fYWtABokdLdMixw_whCKG0UR"
);

// GENERATE TRACKING ID
function generateID() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let p1 = "", p2 = "";

  for (let i = 0; i < 4; i++) {
    p1 += chars[Math.floor(Math.random() * chars.length)];
    p2 += chars[Math.floor(Math.random() * chars.length)];
  }

  return `ELX-${new Date().getFullYear()}-${p1}-${p2}`;
}

// 🏠 HOME
app.get("/", (req, res) => {
  res.send(`
  <style>
    body{margin:0;font-family:Arial;background:#f4f4f4;}
    header{background:#ffcc00;padding:15px;font-size:22px;font-weight:bold;}
    .box{background:white;padding:20px;margin:20px auto;width:90%;max-width:400px;border-radius:10px;}
    input,button{width:100%;padding:12px;margin:6px 0;}
    button{background:#ffcc00;border:none;font-weight:bold;}
  </style>

  <header>EasyLog Express</header>

  <div class="box">
    <h3>Create Shipment</h3>
    <input id="sender" placeholder="Sender">
    <input id="receiver" placeholder="Receiver">
    <button onclick="create()">Create</button>
    <p id="result"></p>
  </div>

  <div class="box">
    <h3>Track</h3>
    <input id="trackId" placeholder="Tracking ID">
    <button onclick="track()">Track</button>
  </div>

  <script>
    function create(){
      fetch('/create',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          sender:sender.value,
          receiver:receiver.value
        })
      })
      .then(r=>r.json())
      .then(d=>result.innerHTML="ID: "+d.id);
    }

    function track(){
      window.location="/track/"+trackId.value;
    }
  </script>
  `);
});

// CREATE
app.post("/create", async (req, res) => {
  const id = generateID();

  await supabase.from("shipments").insert([{
    tracking_id: id,
    sender: req.body.sender,
    receiver: req.body.receiver,
    status: "Processing",
    lat: 6.5244,
    lng: 3.3792
  }]);

  res.json({ id });
});

// TRACK
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
      var map=L.map('map').setView([${data.lat},${data.lng}],6);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
      .addTo(map);

      L.marker([${data.lat},${data.lng}]).addTo(map);
    </script>

    <br>
    <a href="/receipt/${data.tracking_id}">Download Receipt</a>
  `);
});

// ADMIN UPDATE
app.post("/update/:id", async (req, res) => {
  await supabase.from("shipments").update({
    status: req.body.status,
    lat: req.body.lat,
    lng: req.body.lng
  }).eq("tracking_id", req.params.id);

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
  doc.text("EasyLog Express");
  doc.text("Tracking ID: " + data.tracking_id);
  doc.text("Sender: " + data.sender);
  doc.text("Receiver: " + data.receiver);
  doc.text("Status: " + data.status);
  doc.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));
