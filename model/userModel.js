const mongoose = require('mongoose');



const userSchema = new mongoose.Schema({
    profileImage: {
        data: Buffer,
        contentType: String
    },
    email: {
        type: String,
        require: true
    },
    username: {
        type: String,
        require: true
    },
    mobile: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Number,
        default: 0
    },
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: {
            type: Number,
            default: 1
        },
        totalAmount: {
            type: Number
        }
    }],
    grandTotal: {
        type: Number,
        default: 0
    },
    wallet: {
        type: Number,
        default: 0
    },
    walletHistory: [{
        date: {
            type: Date,
        },
        amount: {
            type: Number
        },
        message: {
            type: String
        },
        paymentMethod: {
            type: String
        }
    }],
    wishlist: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        }
    }],
    referalCode: {
        type: String,
    },
})



const Collection = mongoose.model('User', userSchema)
module.exports = Collection