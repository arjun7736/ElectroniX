const mongoose = require('mongoose')


const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            reqiured: true
        },
        quantity: {
            type: Number,
            required: true
        },
        totalAmount: Number
    }],
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered'],
        default: 'Pending'
    },
    orderDate: {
        type: Date,
        default: Date.now()
    },
    deliveryAddress: [{
        username: {
            type: String, required: true
        },
        email: {
            type: String, required: true,
        },
        mobile: {
            type: String, required: true
        },
        address: {
            type: String, required: true
        },
        city: {
            type: String, required: true
        },
        postcode: {
            type: String, required: true
        },
        district: {
            type: String, required: true
        },
        state: {
            type: String, required: true
        },
    }],
    paymentMethod: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid'],
        default: 'Pending'
    },
    cancelReason: {
        type: String,
    },
    returnReason: {
        type: String
    },
    deliverdAt: {
        type: Date
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    discountAmount: {
        type: Number,
    },
    grandTotal: {
        type: Number
    }
})

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;