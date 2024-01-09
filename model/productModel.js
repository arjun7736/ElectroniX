const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
    images: [{
        data: Buffer,
        contentType: String
    }],
    brandname: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    subcategory: {
        type: String,
        required: true,
    },
    varientname: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
        max: 1000
    },
    price: {
        type: Number,
        required: true,
    },
    isDelete: {
        type: Boolean,
        default: false
    },
    offer:{
        type: Number,
        default:0
    }
})


const Product = mongoose.model('Product', productSchema)
module.exports = Product

