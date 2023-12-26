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
            grandTotal: user.grandTotal,
            orderDate:Date.now()
        })
        const data = await order.save()

        for (const cartItem of user.cart) {
            const product = await ProductDB.findById(cartItem.product);
            product.quantity -= cartItem.quantity;
            await product.save();
        }
        user.cart = [];
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

        for (const product of order.products) {
            const originalProduct = await ProductDB.findById(product.product);
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

        product.itemCancelled = true;

        await OrderDB.updateOne({ _id: orderid }, { $set: { cancelReason: reason } });

        const allOrderItemsCancelled = order.products.every(item => item.itemCancelled);

        // Check if it's not the last product in the order
        if (order.products.length > 1 && !allOrderItemsCancelled) {
            // Subtract the canceled product's total amount from grandTotal
            order.totalPrice -= product.totalAmount;
            order.grandTotal -= product.totalAmount;
        }

        if (allOrderItemsCancelled) {
            await OrderDB.updateOne({ _id: orderid }, { $set: { status: "Cancelled" } });
        }

        await originalProduct.save();
        const updatedOrder = await order.save(); // Save the order and get the updated order details

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




module.exports = {
    loadCheckout,
    saveOrder,
    loadSuccess,
    cancelOrder,
    cancelItem,
    checkStock
}