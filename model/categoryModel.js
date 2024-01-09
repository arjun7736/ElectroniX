const mongoose = require('mongoose');

const categorySchema =new mongoose.Schema({
    categoryname:{
        type:String,
        require: true,
    },
    offer:{
        type:Number,
        default:0
    }   
})

const Category = mongoose.model('Category', categorySchema)
 module.exports =Category