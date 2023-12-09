const UserDB = require("../model/userModel")
const ProductDB = require("../model/productModel")


// load cart
const loadCart = async (req, res) => {
    if(req.session.user){
        res.render('User/pages/cart')
    }else{
        console.log("poyi login cheyyeda")
        res.redirect('/login')
    }
}




module.exports = {
    loadCart,

}