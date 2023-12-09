const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userId: {
        type:String,
        required: true
    },
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

})
const Address = mongoose.model('Address', addressSchema);

module.exports = Address;



