const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    otp: { 
        type: Number
     },
    email: { 
        type: String
     },
    expiresAt: { type: Date, default: Date.now, expires: 300 }
})

const OTP = mongoose.model('OTP', otpSchema)
module.exports = OTP 