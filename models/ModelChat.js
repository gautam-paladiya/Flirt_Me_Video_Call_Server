const mongoose = require("mongoose");

var userSchema = mongoose.Schema({
  socketId: {
    type: String,
    required: true,
    unique: true,
  },
  peerId: {
    type: String,
  },
  connectedTo: {
    type: String,
  },
  userId: {
    type: String,
    unique: true,
  },
  isConnected: {
    type: Boolean,
    required: true,
    default: false,
  },
  isAvailable: {
    type: Boolean,
    required: true,
    default: true,
  },
  country: {
    type: String,
  },
  gender: {
    type: String,
  },
},{
    timestamps: true,
  });

module.exports = mongoose.model("Chats", userSchema);
