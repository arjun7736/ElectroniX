const mongoose = require('mongoose');

const subCategorySchema =new mongoose.Schema({
    subcategoryname:{
        type:String,
        require: true,
    }    
})

const subCategory = mongoose.model('SubCategory', subCategorySchema)
 module.exports =subCategory