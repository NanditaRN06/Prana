const mongoose = require("mongoose");

const signupSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, unique: true, sparse: true },
    role: { type: String, default: "visitor" },
    status: { type: String, enum: ["active", "deactivated"], default: "active" },
});

module.exports = mongoose.model("members", signupSchema);
