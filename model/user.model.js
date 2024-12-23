const mongoose = require("mongoose");
const validator = require("validator");
const userRole = require("../utils/userRoles");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: validator.isEmail
    },
    password: {
        type: String,
        required: true
        },
        role: {
            type: String,
            enum: [userRole.MANAGER, userRole.ADMIN, userRole.STUDENT],
            default: userRole.STUDENT
        },
        token: {
            type: String
        },
        profilePicture: {
            type: String,
            default: "uploads/profileImage.png"
        }
});

module.exports = mongoose.model("User", userSchema);