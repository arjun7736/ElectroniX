const mongoose = require('mongoose');


const varientSchema= new mongoose.Schema({
    name: {
        type: String,
         require: true
        },
})

exports.Varient = mongoose.model('Varient', varientSchema)
