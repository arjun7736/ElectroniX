const mongoose = require('mongoose');



const userSchema = new mongoose.Schema({
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
    isAdmin:{
        type:Number,
        default:0
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
})



const Collection = mongoose.model('User', userSchema)
module.exports = Collection