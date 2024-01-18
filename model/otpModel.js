const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    otp: { 
        type: Number
     },
    email: { 
        type: String
     },
     expiresAt: { type: Date, default: () => Date.now() + 300000 } 
    })
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const OTP = mongoose.model('OTP', otpSchema)
module.exports = OTP 