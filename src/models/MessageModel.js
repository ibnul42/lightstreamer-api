const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Unique identifier
  command: { type: String, default: "" }, // Default empty string
  received: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
