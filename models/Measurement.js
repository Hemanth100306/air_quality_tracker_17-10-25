const mongoose = require("mongoose");

const measurementSchema = new mongoose.Schema({
  location: String,
  city: String,
  country: String,
  parameter: String,
  value: Number,
  unit: String,
  lastUpdated: Date,
  fetchedAt: { type: Date, default: Date.now }
});

measurementSchema.index({ location: 1, parameter: 1, lastUpdated: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Measurement", measurementSchema);
