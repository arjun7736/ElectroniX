const mongoose = require('mongoose');



const userSchema = new mongoose.Schema({
    profileImage:{
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


userSchema.pre('save', function(next) {
     const user = this;
    user.cart.forEach(cartItem => {
        cartItem.totalAmount = cartItem.quantity * cartItem.product.price;
    });

    user.grandTotal = user.cart.reduce((total, cartItem) => total + cartItem.totalAmount, 0);

    next();
});


const Collection = mongoose.model('User', userSchema)
module.exports = Collection