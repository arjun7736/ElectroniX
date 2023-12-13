const UserDB = require("../model/userModel")
const ProductDB = require("../model/productModel")


// load cart
const loadCart = async (req, res) => {
    try {
        if (req.session.user) {
            // const Product = await UserDB.populate(cart.product)
            res.render('User/pages/cart')
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error)
    }
}


// add product to cart
const addToCart = async (req, res) => {
    const userId = req.session.user;
    const { product } = req.body;
    try {
        const productInTheCart = await UserDB.findOne({ _id: userId, "cart.product": product }).lean();
        const pro = await ProductDB.findOne({ _id: product })
        if (productInTheCart) {

            await UserDB.updateOne(
                { _id: userId, "cart.product": product },
                {
                    $inc: {
                        "cart.$.quantity": 1,
                        "cart.$.totalAmount": pro.price
                    }
                }
            );
            return res.json({ message: "The product Quntity Incremented" });
        } else {
            await UserDB.updateOne(
                { _id: userId },
                { $addToSet: { cart: { product, quantity: 1, totalAmount: pro.price } } }
            );
            return res.json({ message: 'Product added to cart' });
        }
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ message: 'Failed to add product to cart' });
    }
};


// remove a iterm from cart
const deleteFromCart = async (req, res) => {
    let id = req.body.proID;
    let userId = req.session.user._id;
    await UserDB.updateOne({ _id: userId }, { $pull: { product: { id } } });
    res.send(`item with ID=${id} removed`)
}




module.exports = {
    loadCart,
    addToCart,
    deleteFromCart,



}