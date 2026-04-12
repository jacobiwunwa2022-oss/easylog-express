const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

// =========================
// SUPABASE (YOUR PROJECT)
// =========================
const supabase = createClient(
  "https://zssdeapmesedzilrueoh.supabase.co",
  "sb_publishable_0vfHP85fYWtABokdLdMixw_whCKG0UR"
);

// =========================
// TRACKING ID GENERATOR
// =========================
function generateID() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "ELX-";
  for (let i = 0; i < 10; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// =========================
// HOME PAGE
// =========================
app.get("/", (req, res) => {
  res.send(`
    <h1>EasyLog Express</h1>

    <h3>Register</h3>
    <input id="email" placeholder="Email">
    <input id="password" type="password" placeholder="Password">
    <button onclick="register()">Register</button>

    <h3>Login</h3>
    <button onclick="login()">Login</button>

    <script>
      function register(){
        fetch('/register',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            email:email.value,
            password:password.value
          })
        }).then(()=>alert("Registered"));
      }

      function login(){
        fetch('/login',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            email:email.value,
            password:password.value
          })
        })
        .then(r=>r.json())
        .then(d=>{
          if(d.success){
            localStorage.setItem("user", email.value);
            window.location="/dashboard";
          } else {
            alert("Login failed");
          }
        });
      }
    </script>
  `);
});

// =========================
// REGISTER
// =========================
app.post("/register", async (req, res) => {
  await supabase.from("users").insert([
    {
      email: req.body.email,
      password: req.body.password,
      role: "user"
    }
  ]);

  res.send("ok");
});

// =========================
// LOGIN
// =========================
app.post("/login", async (req, res) => {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("email", req.body.email)
    .eq("password", req.body.password)
    .single();

  if (!data) return res.json({ success: false });

  res.json({ success: true, role: data.role });
});

// =========================
// DASHBOARD (CUSTOMER)
// =========================
app.get("/dashboard", (req, res) => {
  res.send(`
    <h1>Customer Dashboard</h1>

    <input id="sender" placeholder="Sender">
    <input id="receiver" placeholder="Receiver">
    <button onclick="create()">Create Shipment</button>

    <h3>Your Shipments</h3>
    <div id="list"></div>

    <script>
      const user = localStorage.getItem("user");

      function create(){
        fetch('/create',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            sender:sender.value,
            receiver:receiver.value,
            user:user
          })
        }).then(()=>load());
      }

      function load(){
        fetch('/myshipments/'+user)
        .then(r=>r.json())
        .then(data=>{
          list.innerHTML="";
          data.forEach(s=>{
            list.innerHTML += "<p><a href='/track/"+s.tracking_id+"'>"+s.tracking_id+"</a> - "+s.status+"</p>";
          });
        });
      }

      load();
    </script>
  `);
});

// =========================
// CREATE SHIPMENT
// =========================
app.post("/create", async (req, res) => {
  const id = generateID();

  await supabase.from("shipments").insert([
    {
      tracking_id: id,
      sender: req.body.sender,
      receiver: req.body.receiver,
      user: req.body.user,
      status: "Created",
      lat: 6.5244,
      lng: 3.3792,
      timeline: JSON.stringify([
        { step: "Shipment Created", time: new Date().toLocaleString() }
      ])
    }
  ]);

  res.json({ id });
});

// =========================
// USER SHIPMENTS
// =========================
app.get("/myshipments/:user", async (req, res) => {
  const { data } = await supabase
    .from("shipments")
    .select("*")
    .eq("user", req.params.user);

  res.json(data);
});

// =========================
// TRACK PAGE
// =========================
app.get("/track/:id", async (req, res) => {
  const { data } = await supabase
    .from("shipments")
    .select("*")
    .eq("tracking_id", req.params.id)
    .single();

  if (!data) return res.send("Not found");

  const timeline = JSON.parse(data.timeline || "[]");

  let steps = "";
  timeline.forEach(t => {
    steps += `<p>✔ ${t.step} - ${t.time}</p>`;
  });

  res.send(`
    <h1>${data.tracking_id}</h1>
    <h2>Status: ${data.status}</h2>

    <h3>Timeline</h3>
    ${steps}

    <h3>Map</h3>
    <p>Location: ${data.lat}, ${data.lng}</p>

    <br>
    <a href="/receipt/${data.tracking_id}">Download Receipt</a>
  `);
});

// =========================
// ADMIN DASHBOARD
// =========================
app.get("/admin", async (req, res) => {
  const { data } = await supabase.from("shipments").select("*");

  let rows = "";
  data.forEach(s => {
    rows += `<tr><td>${s.tracking_id}</td><td>${s.status}</td></tr>`;
  });

  res.send(`
    <h1>Admin Dashboard</h1>

    <table border="1" cellpadding="10">
      <tr><th>ID</th><th>Status</th></tr>
      ${rows}
    </table>

    <h3>Update Shipment</h3>
    <input id="id" placeholder="Tracking ID">
    <input id="status" placeholder="Status">
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

// =========================
// UPDATE SHIPMENT
// =========================
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

// =========================
// RECEIPT (PDF)
// =========================
app.get("/receipt/:id", async (req, res) => {
  const { data } = await supabase
    .from("shipments")
    .select("*")
    .eq("tracking_id", req.params.id)
    .single();

  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);
  doc.fontSize(20).text("EasyLog Express Receipt");
  doc.text("Tracking ID: " + data.tracking_id);
  doc.text("Sender: " + data.sender);
  doc.text("Receiver: " + data.receiver);
  doc.text("Status: " + data.status);
  doc.end();
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
