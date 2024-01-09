const mongoose = require('mongoose');

const subCategorySchema =new mongoose.Schema({
    subcategoryname:{
        type:String,
        require: true,
    },
    offer:{
        type: Number,
        default:0
    }    
})

const subCategory = mongoose.model('SubCategory', subCategorySchema)
 module.exports =subCategory