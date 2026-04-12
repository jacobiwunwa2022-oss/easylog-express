const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// SUPABASE
const supabase = createClient(
  "https://zssdeapmesedzilrueoh.supabase.co",
  "sb_publishable_0vfHP85fYWtABokdLdMixw_whCKG0UR"
);

// TRACKING ID
function generateID() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let p1 = "", p2 = "";

  for (let i = 0; i < 4; i++) {
    p1 += chars[Math.floor(Math.random() * chars.length)];
    p2 += chars[Math.floor(Math.random() * chars.length)];
  }

  return `ELX-${new Date().getFullYear()}-${p1}-${p2}`;
}

// HOME (PRO UI)
app.get("/", (req, res) => {
  res.send(`
  <style>
    body{margin:0;font-family:Arial;background:#f5f5f5;}
    header{background:#ffcc00;padding:15px;font-size:22px;font-weight:bold;}
    .hero{background:black;color:white;padding:60px;text-align:center;}
    .container{max-width:500px;margin:auto;padding:20px;}
    .box{background:white;padding:20px;margin-top:20px;border-radius:10px;}
    input,button{width:100%;padding:12px;margin:6px 0;}
    button{background:#ffcc00;border:none;font-weight:bold;}
  </style>

  <header>EasyLog Express</header>

  <div class="hero">
    <h1>Global Logistics & Delivery</h1>
    <p>Fast. Secure. Worldwide.</p>
  </div>

  <div class="container">
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
      .then(d=>result.innerHTML="Tracking ID: "+d.id);
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
    status: "Shipment Created",
    lat: 6.5244,
    lng: 3.3792,
    timeline: JSON.stringify([
      { step: "Shipment Created", time: new Date().toLocaleString() }
    ])
  }]);

  res.json({ id });
});

// TRACK (PRO)
app.get("/track/:id", async (req, res) => {
  const { data } = await supabase
    .from("shipments")
    .select("*")
    .eq("tracking_id", req.params.id)
    .single();

  if (!data) return res.send("Shipment not found");

  const timeline = JSON.parse(data.timeline || "[]");

  let timelineHTML = "";
  timeline.forEach(t => {
    timelineHTML += `<p>✔ ${t.step} - ${t.time}</p>`;
  });

  res.send(`
    <h1>${data.tracking_id}</h1>
    <h2>Status: ${data.status}</h2>

    <h3>Tracking Timeline</h3>
    ${timelineHTML}

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

// ADMIN DASHBOARD
app.get("/admin", async (req, res) => {
  const { data } = await supabase.from("shipments").select("*");

  let rows = "";
  data.forEach(s => {
    rows += `
      <tr>
        <td>${s.tracking_id}</td>
        <td>${s.status}</td>
      </tr>
    `;
  });

  res.send(`
    <h1>Admin Dashboard</h1>

    <table border="1" cellpadding="10">
      <tr><th>ID</th><th>Status</th></tr>
      ${rows}
    </table>

    <h3>Update Shipment</h3>
    <input id="id" placeholder="Tracking ID">
    <input id="status" placeholder="New Status">
    <button onclick="update()">Update</button>

    <script>
      function update(){
        fetch('/update/'+id.value,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({status:status.value})
        }).then(()=>alert("Updated"));
      }
    </script>
  `);
});

// UPDATE
app.post("/update/:id", async (req, res) => {
  const { data } = await supabase
    .from("shipments")
    .select("*")
    .eq("tracking_id", req.params.id)
    .single();

  let timeline = JSON.parse(data.timeline || "[]");

  timeline.push({
    step: req.body.status,
    time: new Date().toLocaleString()
  });

  await supabase.from("shipments").update({
    status: req.body.status,
    timeline: JSON.stringify(timeline)
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
