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

// HOME
app.get("/", (req, res) => {
  res.send(`
  <h1>EasyLog Express</h1>

  <h2>Login</h2>
  <input id="email" placeholder="Email">
  <input id="password" type="password" placeholder="Password">
  <button onclick="login()">Login</button>

  <h2>Register</h2>
  <button onclick="register()">Create Account</button>

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

// REGISTER
app.post("/register", async (req, res) => {
  await supabase.from("users").insert([{
    email: req.body.email,
    password: req.body.password,
    role: "user"
  }]);
  res.send("Registered");
});

// LOGIN
app.post("/login", async (req, res) => {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("email", req.body.email)
    .eq("password", req.body.password)
    .single();

  if (!data) return res.json({ success:false });

  res.json({ success:true, role:data.role });
});

// DASHBOARD
app.get("/dashboard", async (req, res) => {
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
            list.innerHTML += "<p>"+s.tracking_id+" - "+s.status+"</p>";
          });
        });
      }

      load();
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
    user: req.body.user,
    status: "Created",
    timeline: JSON.stringify([
      { step:"Created", time:new Date().toLocaleString() }
    ])
  }]);

  res.json({ id });
});

// USER SHIPMENTS
app.get("/myshipments/:user", async (req, res) => {
  const { data } = await supabase
    .from("shipments")
    .select("*")
    .eq("user", req.params.user);

  res.json(data);
});

// PAYMENT (PAYSTACK BUTTON)
app.get("/pay/:id", (req, res) => {
  res.send(`
    <h2>Pay for Shipment</h2>

    <button onclick="pay()">Pay Now</button>

    <script src="https://js.paystack.co/v1/inline.js"></script>

    <script>
      function pay(){
        var handler = PaystackPop.setup({
          key: 'YOUR_PUBLIC_KEY',
          email: "customer@email.com",
          amount: 500000,
          callback: function(response){
            alert("Payment successful");
          }
        });
        handler.openIframe();
      }
    </script>
  `);
});

// ADMIN
app.get("/admin", async (req, res) => {
  const { data } = await supabase.from("shipments").select("*");

  let rows = "";
  data.forEach(s=>{
    rows += "<tr><td>"+s.tracking_id+"</td><td>"+s.status+"</td></tr>";
  });

  res.send(`
    <h1>Admin Dashboard</h1>

    <table border="1">
      <tr><th>ID</th><th>Status</th></tr>
      ${rows}
    </table>
  `);
});

// START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running"));
