const mongoose = require("mongoose");

var userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
    },
    signupType: {
      type: String,
      required: true,
    },
    fcmToken: {
      type: String,
    },
    coin: {
      type: Number,
      required: true,
      default: 50,
    },
    country: {
      type: String,
    },
    userId: {
      type: String,
    },
    accessToken: {
      type: String,
    },
    picture: {
      type: String,
    },
    birthDate: {
      type: String,
    },
    genderMatch: {
      type: String,
      default: "Both",
    },
    countryMatch: {
      type: String,
      default: "Global",
    },
    online: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Users", userSchema);
