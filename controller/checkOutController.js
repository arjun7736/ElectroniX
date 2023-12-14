const UserDB = require("../model/userModel")
const ProductDB = require("../model/productModel")
const AddressDB= require("../model/addressModel")

const loadCheckout = async (req, res) => {

    try {
        if(req.session.user){
            const userId =req.session.user
            let cartData= await UserDB.findById(userId).select('cart')
            const address =await AddressDB.find({userId:userId})
            // console.log(data,address);
            // if(address){
            //     console.log("Addresss")
            // }
            res.render('User/pages/checkout',{address,cartData})
        }else{
            res.redirect('/login');
        }
    }
     catch (error) {
        console.log(error)
    }
}



module.exports = {
    loadCheckout
}