const mongoose = require('mongoose');
const Schema = mongoose.Schema

const CouponSchema = new Schema({
    couponName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    discountType: {
        type: String,
        enum: ["Percentage", "Amount"],
        required: true,
    },
    minimumPurchaseAmount: {
        type: Number,
        min: 0,
    },
    startDate:{
        type : Date
    },
    expaireDate: {
        type: Date,
    },

    discountAmountOrPercentage: {
        type: Number,
        required: true
    },
    code: {
        type: String,
        required: true,
    },
    couponDone: {
        type: Boolean,
        default: false
    },
    user: [{
        type: String
    }]
})
const coupon = mongoose.model("coupon", CouponSchema)
module.exports = coupon;