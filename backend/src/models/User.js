const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    dob: { type: String, default: "" },

    // NO enum here — accepts any string role value
    role: { type: String, default: "" },

    profilePicture: { type: String, default: "" },
    coverPicture: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    headline: { type: String, default: "" },
    location: { type: String, default: "" },
    about: { type: String, default: "" },
    bio: { type: String, default: "" },

    skills: { type: [String], default: [] },
    education: { type: [String], default: [] },
    achievements: { type: [String], default: [] },

    experience: [
      { company: String, position: String, duration: String }
    ],
    certifications: [
      { title: String, issuer: String }
    ],
    socialLinks: {
      github: String,
      linkedin: String,
      portfolio: String,
    },
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },

    profileViews: { type: Number, default: 0 },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    requests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
