const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
    images:[{
        type:String,
        required: true
    }],
    brandname:{
        type:String,
        // ref:'Brand',
        required: true,
    },
    category:{
        type:String,
        // ref:'Category',
        required: true,
    },

    varientname:{
        type:String,
        // ref:'Varient',
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

