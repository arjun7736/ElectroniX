const UserDB = require("../model/userModel")
const ProductDB = require("../model/productModel")
const AddressDB = require("../model/addressModel")
const { v4: uuidv4 } = require("uuid");
const OrderDB = require("../model/orderModel")

const loadCheckout = async (req, res) => {
    try {
        if (req.session.user) {
            const userId = req.session.user
            const user = await UserDB.findById(userId).populate('cart.product');
            const cartData = user.cart;
            const address = await AddressDB.find({ userId: userId })
            res.render('User/pages/checkout', { address, cartData, user })
        } else {
            res.redirect('/login');
        }
    }
    catch (error) {
        console.log(error)
    }
}


// place order
const saveOrder = async (req, res) => {
    const { address, payment } = req.query
    try {
        const user = await UserDB.findById(req.session.user).populate('cart')
        const addres = await AddressDB.find({ userId: req.session.user })
        const currentAddress = addres[address]
        // console.log(addres)
        const orderId = uuidv4()
        const order = new OrderDB({
            orderId: orderId,
            user: req.session.user,
            products: user.cart,
            totalPrice: user.grandTotal,
            deliveryAddress: [currentAddress],
            paymentMethod: payment,
            grandTotal: user.grandTotal
        })
        const data = await order.save()
        return res.json(data);
    } catch (error) {
        console.log(error)
    }
}


// load order success page
const loadSuccess = async (req, res) => {
    const order = await OrderDB.find({ userId: req.session.user }).sort({ orderDate: -1 }).limit(1).populate('products.product')
    res.render('User/pages/orderSuccess', {order})
}






module.exports = {
    loadCheckout,
    saveOrder,
    loadSuccess
}