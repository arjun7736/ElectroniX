const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    brandname:{
        type:String,
        require: true,
    }
})


const Brand = mongoose.model('Brand', brandSchema)
module.exports =Brand