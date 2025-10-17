require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const cron = require("node-cron");
const path = require("path");

const app = express();
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const CITY = process.env.CITY || "Hyderabad";
const COUNTRY = process.env.COUNTRY || "IN";

// Use your OpenWeatherMap API key here
const API_KEY = process.env.API_KEY;
// default key from your account
// Coordinates for Hyderabad
const LAT = 17.3850;
const LON = 78.4867;

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => { console.error("Mongo connect error:", err); process.exit(1); });

// Fetch air quality data from OpenWeatherMap
async function fetchAirQuality() {
  try {
    const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${LAT}&lon=${LON}&appid=${API_KEY}`;
    const res = await axios.get(url);
    const data = res.data.list[0]; // latest measurement
    const pollutants = data.components; // pm2_5, pm10, no2, so2, etc.
    
    for (const [param, value] of Object.entries(pollutants)) {
      const doc = {
        location: CITY,
        city: CITY,
        country: COUNTRY,
        parameter: param,
        value,
        unit: "µg/m3",
        lastUpdated: new Date()
      };
      try {
        await Measurement.findOneAndUpdate(
          { location: doc.location, parameter: doc.parameter, lastUpdated: doc.lastUpdated },
          { $setOnInsert: doc },
          { upsert: true, setDefaultsOnInsert: true }
        );
      } catch {}
    }
    console.log("✅ Fetch complete:", new Date().toLocaleTimeString());
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}

// Cron job: every 2 minutes
cron.schedule("*/2 * * * *", fetchAirQuality);

// API endpoint to get latest measurements
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
      { $sort: { parameter: 1 } }
    ]);
    res.json({ ok: true, results: latest });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Home page
app.get("/", (req, res) => res.render("index"));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  fetchAirQuality().catch(()=>{});
});
