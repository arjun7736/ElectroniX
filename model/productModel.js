const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
    images: [{
        data: { type: Buffer, required: true },
        contentType: { type: String, required: true },
    }],
    brandname:{
        type:String,
        required: true,
    },
    category:{
        type:String,
        required: true,
    },
    subcategory:{
        type:String,
        required: true,
    },
    varientname:{
        type:String,
        required: true,
    },
    description:{
        type:String,
        required: true,
    },
    quantity:{
        type:Number,
        required: true,
        min:0,
        max:1000
    },
    price:{
        type:Number,
        required: true,
    },

})


const Product=mongoose.model('Product',productSchema)
module.exports=Product

