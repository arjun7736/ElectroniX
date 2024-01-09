const UserDB = require("../model/userModel")
const ProductDB = require("../model/productModel")
const CategoryDB = require("../model/categoryModel")
const SubCategoryDB = require('../model/subcategoryModel')

// load cart
const loadCart = async (req, res) => {
    try {
        if (!req.session.user) {
            res.redirect('/login');
        } else {
            const user = await UserDB.findById(req.session.user).populate('cart.product');
            const cart = user.cart;
            res.render('User/pages/cart', { cart, user });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};



// add product to cart
const addToCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const { product, quantity } = req.body;
        const pro = await ProductDB.findOne({ _id: product });

        const SubCategory = await SubCategoryDB.find()
        const Category = await CategoryDB.find()

        const offerCategory = Category.filter((value) => value.offer > 0)
        const offerSubCategory = SubCategory.filter((value) => value.offer > 0)

        const subOffer = offerSubCategory.find((offer) => (offer.subcategoryname == pro.subcategory))
        const catOff = offerCategory.find((offer) => (offer.categoryname == pro.category))
        let total = 0
        if (subOffer || catOff || offerProduct) {
            if (subOffer ) {
                total =pro.price- (pro.price * subOffer.offer / 100)
            } else if(catOff) {
                total = pro.price- (pro.price * catOff.offer / 100)
            }
            else{
                total = pro.price- (pro.price * pro.offer / 100)
            }
        }


        const user = await UserDB.findById(userId).populate('cart.product');
        const cart = user.cart;
       let incrementAmount =0
        if (subOffer || catOff) {
             incrementAmount = total * quantity
        }
        else {
             incrementAmount = pro.price * quantity;
        }

        const productInTheCart = cart.find(cartItem => cartItem.product.equals(product));

        if (productInTheCart) {
            await UserDB.updateOne(
                { _id: userId, "cart.product": product },
                {
                    $inc: {
                        "cart.$.quantity": quantity,
                        "cart.$.totalAmount": incrementAmount,
                        "grandTotal": incrementAmount
                    }
                }
            );

            return res.json({ message: "The product quantity updated" });
        } else {
            await UserDB.updateOne(
                { _id: userId },
                {
                    $addToSet: {
                        cart: { product, quantity, totalAmount: incrementAmount },
                    },
                    $inc: {
                        "grandTotal": incrementAmount
                    }
                }
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
    const { product } = req.body;
    const userId = req.session.user;

    try {
        const user = await UserDB.findById(userId).populate('cart.product');
        const removedItem = user.cart.find(cartItem => cartItem.product.equals(product));

        if (removedItem) {
            const reductionAmount = removedItem.totalAmount;

            await UserDB.updateOne({ _id: userId }, { $pull: { cart: { product: product } } });

            const remainingCart = await UserDB.findById(userId).populate('cart.product');
            const updatedGrandTotal = remainingCart.cart.reduce((total, cartItem) => total + cartItem.totalAmount, 0);

            await UserDB.updateOne({ _id: userId }, { grandTotal: updatedGrandTotal });

            if (remainingCart.cart.length === 0) {
                const updatedGrandTotal = 0;
                await UserDB.updateOne({ _id: userId }, { grandTotal: updatedGrandTotal });
                return res.json({ message: `Item with ID=${product} removed`, grandTotal: updatedGrandTotal });
            }

            res.json({ message: `Item with ID=${product} removed`, grandTotal: updatedGrandTotal });
        } else {
            return res.status(404).json({ message: 'Item not found in the cart' });
        }
    } catch (error) {
        console.error('Error removing product from cart:', error);
        res.status(500).json({ message: 'Failed to remove product from cart' });
    }
};











// update Quantity 
const updateQuantityInCart = async (req, res) => {
    const { product, quantity } = req.body;
    const userId = req.session.user;

    try {
        const pro = await ProductDB.findOne({ _id: product });

        const userBeforeUpdate = await UserDB.findOne({ _id: userId, 'cart.product': product });

        if (!userBeforeUpdate) {
            return res.status(404).json({ message: 'User not found or product not in cart' });
        }

        const updatedQuantity = parseInt(quantity);
        const previousQuantity = userBeforeUpdate.cart.find(item => item.product.equals(product)).quantity;

        const updatedUser = await UserDB.findOneAndUpdate(
            { _id: userId, 'cart.product': product },
            {
                $set: {
                    'cart.$.quantity': updatedQuantity,
                },
                $inc: {
                    'cart.$.totalAmount': pro.price * (updatedQuantity - previousQuantity),
                    'grandTotal': pro.price * (updatedQuantity - previousQuantity),
                },
            },
            { new: true }
        );

        res.json({
            message: 'Quantity updated',
            quantity: updatedUser.cart.find(item => item.product.equals(product)).quantity,
            totalAmount: updatedUser.cart.find(item => item.product.equals(product)).totalAmount,
            grandtotal: updatedUser.grandTotal
        });
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ message: 'Failed to update quantity' });
    }
};



module.exports = {
    loadCart,
    addToCart,
    deleteFromCart,
    updateQuantityInCart,


}