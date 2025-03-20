const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Alphanumeric ID
  command: { type: String, default: "" }, // Command details
  received: { type: Boolean, default: false }, // Received status
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
