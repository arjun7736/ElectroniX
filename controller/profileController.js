const UserDB = require("../model/userModel");
const ProductDB = require("../model/productModel")
const AddressDB=require('../model/addressModel')

// load profile
const loadProfile = (req, res) => {
    res.render('User/pages/account')
}


module.exports={
    loadProfile,

}