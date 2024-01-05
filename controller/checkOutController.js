const UserDB = require("../model/userModel")
const ProductDB = require("../model/productModel")
const AddressDB = require("../model/addressModel")
const { v4: uuidv4 } = require("uuid");
const CoupenDB = require('../model/coupenModel')
const OrderDB = require("../model/orderModel")
const Razorpay = require('razorpay');
const easyinvoice = require('easyinvoice');
const fs = require('fs');
const path = require('path');



const loadCheckout = async (req, res) => {
    try {
        if (req.session.user) {
            const userId = req.session.user
            const user = await UserDB.findById(userId).populate('cart.product');
            const cartData = user.cart;
            const totalAmount = cartData.reduce((accumulator, item) => accumulator + item.totalAmount, 0);
            const address = await AddressDB.find({ userId: userId })
            res.render('User/pages/checkout', { address, cartData, user, totalAmount })
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
    const { address, payment, } = req.query
    const totalPrice = req.body.data.totalPrice
    try {
        const user = await UserDB.findById(req.session.user).populate('cart')
        const addres = await AddressDB.find({ userId: req.session.user })
        const currentAddress = addres[address]
        const orderId = uuidv4()
        let paymentstatus = 0;
        if (payment == 'razorpay' || payment == 'wallet') {
            paymentstatus = 'Paid'
        } else {
            paymentstatus = 'Pending'
        }
        if (payment == 'wallet') {
            if (user.wallet > user.grandTotal) {
                user.wallet -= user.grandTotal
                user.walletHistory.push({
                    date: Date.now(),
                    amount: user.grandTotal,
                    message: `Buy a product`,
                    paymentMethod: 'wallet'
                });
                await user.save();
            }
            else {
                return res.status(400).json({ success: false, message: "Wallet Amount Exeeds" })
            }
        }
        const order = new OrderDB({
            orderId: orderId,
            user: req.session.user,
            products: user.cart,
            totalPrice: user.grandTotal,
            deliveryAddress: [currentAddress],
            paymentMethod: payment,
            totalPrice: totalPrice,
            grandTotal: user.grandTotal,
            discountAmount: totalPrice - user.grandTotal,
            orderDate: Date.now(),
            paymentStatus: paymentstatus,

        })
        const data = await order.save()
        for (const cartItem of user.cart) {
            const product = await ProductDB.findById(cartItem.product);
            product.quantity -= cartItem.quantity;
            await product.save();
        }
        user.cart = [];
        user.grandTotal = 0;
        await user.save();

        return res.json(data);
    } catch (error) {
        console.log(error)
    }
}


// load order success page
const loadSuccess = async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    const order = await OrderDB.find({ user: req.session.user }).sort({ orderDate: -1 }).limit(1).populate('products.product')
    res.render('User/pages/orderSuccess', { order })
}



// cancelorder
const cancelOrder = async (req, res) => {
    let { id } = req.params;
    const { reason } = req.body;
    try {
        const order = await OrderDB.findOne({ orderId: id });
        if (order.paymentMethod == 'razorpay' || order.paymentMethod == 'wallet') {
            const user = await UserDB.findById(req.session.user)
            user.wallet += order.grandTotal
            user.walletHistory.push({
                date: Date.now(),
                amount: order.grandTotal,
                message: `Cancellation Of product!`,
                paymentMethod: order.paymentMethod
            });
            await user.save();
        }

        for (const product of order.products) {
            const originalProduct = await ProductDB.findById(product.product)
            originalProduct.quantity += product.quantity;
            await originalProduct.save();
        }
        for (const product of order.products) {
            product.itemCancelled = true;
        }
        await order.save();


        const result = await OrderDB.findOneAndUpdate(
            { orderId: id },
            { $set: { status: 'Cancelled', cancelReason: reason } },
            { new: true }
        );


        return res.json({ success: true, message: 'Order cancelled successfully.', result });
    } catch (err) {
        console.error('Error cancelling order:', err);
        return res.status(500).json({ success: false, message: 'Failed to cancel order. Please try again.' });
    }
};


// cancel each iem from existing order
const cancelItem = async (req, res) => {
    const { itemID, orderid, reason } = req.body;

    try {
        const order = await OrderDB.findById(orderid);
        const product = order.products.find(product => product._id.toString() === itemID);


        const canceledQuantity = product.quantity;
        const originalProduct = await ProductDB.findById(product.product);
        originalProduct.quantity += canceledQuantity;

        if (order.paymentMethod == 'razorpay' || order.paymentMethod == 'wallet') {
            const user = await UserDB.findById(req.session.user)
            user.wallet += originalProduct.price
            await user.save();
        }

        product.itemCancelled = true;

        await OrderDB.updateOne({ _id: orderid }, { $set: { cancelReason: reason } });

        const allOrderItemsCancelled = order.products.every(item => item.itemCancelled);


        if (order.products.length > 1 && !allOrderItemsCancelled) {

            order.totalPrice -= product.totalAmount;
            order.grandTotal -= product.totalAmount;
        }

        if (allOrderItemsCancelled) {
            await OrderDB.updateOne({ _id: orderid }, { $set: { status: "Cancelled" } });
        }

        await originalProduct.save();
        const updatedOrder = await order.save();

        return res.json({ success: true, message: 'Item canceled successfully.', updatedOrder });
    } catch (error) {
        console.error('Error canceling item:', error);
        return res.status(500).json({ success: false, message: 'Failed to cancel item. Please try again.' });
    }
};








// check stock
const checkStock = async (req, res) => {
    try {
        const user = await UserDB.findOne({ _id: req.session.user });

        for (const cartItem of user.cart) {
            const product = await ProductDB.findOne({ _id: cartItem.product });

            if (product.quantity < cartItem.quantity) {
                console.log("Insufficient stock for product:", product._id);
                return res.json({ success: false, insufficientStockProducts: [{ productId: product._id, quantity: product.quantity }] });
            }
        }

        console.log("All products have sufficient stock");
        return res.json({ success: true });
    } catch (error) {
        console.error('Error checking stock:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


// return Order
const returnOrder = async (req, res) => {
    try {
        const { reason } = req.body
        const { orderId } = req.params
        const order = await OrderDB.findOne({ orderId: orderId });
        order.returnReason = reason
        order.status = 'Return'
        for (const orderItem of order.products) {
            const product = await ProductDB.findById(orderItem.product);
            if (product) {
                product.quantity = + orderItem.quantity;
                await product.save();
            }
        }
        const user = await UserDB.findById(req.session.user)
        user.wallet += order.grandTotal
        user.walletHistory.push({
            date: Date.now(),
            amount: order.grandTotal,
            message: `${order.returnReason} orderId:-${order.orderId}`
        });
        await user.save()
        order.save()
        res.json({ success: true, order })
    }
    catch (error) {
        console.log(error);
    }
}

// razor pay
const razorPay = async (req, res) => {
    try {
        var instance = new Razorpay({
            key_id: process.env.RAZORKEY,
            key_secret: process.env.RAZORSECRET,
        });
        var instance = new Razorpay({ key_id: process.env.RAZORKEY, key_secret: process.env.RAZORSECRET })
        const user = await UserDB.findById(req.session.user)

        var options = {
            amount: user.grandTotal,
            currency: "INR",
            receipt: "order_rcptid_11"
        };
        instance.orders.create(options, function (err, order) {
            res.json({ orderId: order.id });
        });
    }
    catch (error) {
        console.log(error)
    }
}

// applyCoupen
const applyCoupen = async (req, res) => {
    try {
        const { code } = req.body
        const user = await UserDB.findById(req.session.user).populate("cart")
        const coupen = await CoupenDB.findOne({ code: code })
        console.log(coupen.minimumPurchaseAmount, user.grandTotal)
        if (coupen.minimumPurchaseAmount > user.grandTotal) {
            return res.status(403).json({ success: false, message: "Your cart value is less than the minimum purchase Amount" })
        }
        if (coupen.couponDone) {
            console.log("This coupon has been used")
            return res.status(400).json({ success: false, message: "This coupon has been used." })
        } else {
            if (coupen.discountType == 'Amount') {
                user.grandTotal -= coupen.discountAmountOrPercentage
                const total = user.grandTotal
                const discount = coupen.discountAmountOrPercentage
                await user.save()
                res.json({ success: true, total, discount, code })
            } else {
                const discount = (user.grandTotal * coupen.discountAmountOrPercentage) / 100;
                user.grandTotal -= discount
                const total = user.grandTotal;
                await user.save()
                res.json({ success: true, total, discount, code })
            }

        }
        await CoupenDB.findByIdAndUpdate(coupen._id, { couponDone: true })
    } catch (error) {
        console.log(error)
    }
}

// load invoice
const loadInvoice = async (req, res) => {
    try {
        const { orderId } = req.params
        const order =await OrderDB.findOne({ orderId: orderId }).populate('products.product')
        res.render('User/pages/invoice',{order})
    } catch (error) {
        console.log(error)
    }
}



module.exports = {
    loadCheckout,
    saveOrder,
    loadSuccess,
    cancelOrder,
    cancelItem,
    checkStock,
    returnOrder,
    razorPay,
    applyCoupen,
    loadInvoice,
}