const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Generate tracking ID
function generateTracking() {
  return "ELX" + Math.floor(Math.random() * 1000000);
}

// CREATE SHIPMENT
app.post("/create", async (req, res) => {
  const id = generateTracking();

  const { sender, receiver } = req.body;

  await supabase.from("shipments").insert([{
    id,
    sender,
    receiver,
    status: "Shipment Created",
    timeline: []
  }]);

  res.json({ trackingNumber: id });
});

// TRACK
app.get("/track/:id", async (req, res) => {
  const { data } = await supabase
    .from("shipments")
    .select("*")
    .eq("id", req.params.id)
    .single();

  res.json(data);
});

// UPDATE (ADMIN)
app.post("/update", async (req, res) => {
  const { id, status, location } = req.body;

  const { data } = await supabase
    .from("shipments")
    .select("timeline")
    .eq("id", id)
    .single();

  let timeline = data.timeline || [];

  timeline.push({
    status,
    location,
    time: new Date()
  });

  await supabase
    .from("shipments")
    .update({ status, timeline })
    .eq("id", id);

  res.json({ success: true });
});

// GET ALL (dashboard)
app.get("/all", async (req, res) => {
  const { data } = await supabase.from("shipments").select("*");
  res.json(data);
});

app.listen(process.env.PORT, () => {
  console.log("Server running");
});
