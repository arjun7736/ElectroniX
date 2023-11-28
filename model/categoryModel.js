const mongoose = require('mongoose');

const categorySchema =new mongoose.Schema({
    categoryname:{
        type:String,
        require: true,
    }    
})

const Category = mongoose.model('Category', categorySchema)
 module.exports =Category