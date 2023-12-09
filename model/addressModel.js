const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    userName: {
        type: String, required: true
    },
    email: {
        type: String, required: true, unique: true
    },
    mobile: {
        type: String, required: true
    },
    line1: {
        type: String, required: true
    },
    place: {
        type: String, required: true
    },
    post: {
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



