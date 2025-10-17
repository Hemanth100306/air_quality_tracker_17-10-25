require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cron = require("node-cron");
const Measurement = require("./models/Measurement");
const path = require("path");

const app = express();
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const CITY = process.env.CITY || "Hyderabad";
const COUNTRY = process.env.COUNTRY || "IN";

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => { console.error("Mongo connect error:", err); process.exit(1); });

async function fetchAirQuality() {
  try {
    const url = `https://api.openaq.org/v2/latest?country=${COUNTRY}&city=${encodeURIComponent(CITY)}`;
    const res = await axios.get(url);
    const results = res.data.results || [];

    for (const loc of results) {
      const locationName = loc.location;
      const measurements = loc.measurements || [];
      for (const m of measurements) {
        const doc = {
          location: locationName,
          city: loc.city,
          country: loc.country,
          parameter: m.parameter,
          value: m.value,
          unit: m.unit,
          lastUpdated: new Date(m.lastUpdated)
        };
        try {
          await Measurement.findOneAndUpdate(
            { location: doc.location, parameter: doc.parameter, lastUpdated: doc.lastUpdated },
            { $setOnInsert: doc },
            { upsert: true, setDefaultsOnInsert: true }
          );
        } catch {}
      }
    }
    console.log("✅ Fetch complete:", new Date().toLocaleTimeString());
  } catch (err) { console.error("Fetch error:", err.message); }
}

// cron every 2 minutes
cron.schedule("*/2 * * * *", fetchAirQuality);

app.get("/api/latest", async (req, res) => {
  try {
    const latest = await Measurement.aggregate([
      { $sort: { lastUpdated: -1 } },
      {
        $group: {
          _id: { location: "$location", parameter: "$parameter" },
          location: { $first: "$location" },
          city: { $first: "$city" },
          country: { $first: "$country" },
          parameter: { $first: "$parameter" },
          value: { $first: "$value" },
          unit: { $first: "$unit" },
          lastUpdated: { $first: "$lastUpdated" }
        }
      },
      { $sort: { location: 1, parameter: 1 } }
    ]);
    res.json({ ok: true, results: latest });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.get("/", (req, res) => res.render("index"));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  fetchAirQuality().catch(()=>{});
});
