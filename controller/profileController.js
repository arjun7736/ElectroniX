const UserDB = require("../model/userModel");
const ProductDB = require("../model/productModel")
const AddressDB = require('../model/addressModel')
const bcrypt = require('bcrypt');
const CoupenDB = require('../model/coupenModel')
const OrderDB = require('../model/orderModel')
const multer = require('multer');
const upload = multer();
const fileUpload = require('express-fileupload');


const securepassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash;
    } catch (error) {
        console.log(error.message)
        res.redirect('/500')

    }
}

function isValidPassword(password) {
    const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return passwordRegex.test(password);
}



// load profile
const loadprofile = async (req, res) => {
    if (req.session.user) {
        const user = await UserDB.findById(req.session.user);
        res.render('User/pages/account', { user })
    } else {
        console.log("poyi login cheyyeda")
        res.redirect('/login')
    }
}


// load address
const loadAddress = async (req, res) => {
    try {
        const id = req.session.user;
        const user = await UserDB.findById(req.session.user);
        const Address = await AddressDB.find({ userId: id })
        if (req.session.user) {
            res.render('User/pages/address', { Address, user })
        } else {
            console.log("poyi login cheyyeda")
            res.redirect('/login')
        }
    }
    catch (err) {
        console.log(err)
        res.redirect('/500')

    }
}



// load change password
const loadChangePassword = async (req, res) => {
    try {
        if (req.session.user) {
            const user = await UserDB.findById(req.session.user);
            res.render('User/pages/changePassword', { user })
        } else {
            console.log("poyi login cheyyeda")
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error)
        res.redirect('/500')

    }
}


// save edited profile data
const saveEditProfile = async (req, res) => {
    const { username, mobile, email, } = req.body
    try {
        const user = await UserDB.findById(req.session.user);

        user.username = username;
        user.email = email;
        user.mobile = mobile;

        await user.save();
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.redirect('/500')
    }

}

// loadAddAddress
const loadAddAddress = async (req, res) => {
    try {
        if (req.session.user) {
            const user = await UserDB.findById(req.session.user);
            res.render('User/pages/addaddress', { user })
        } else {
            console.log("poyi login cheyyeda")
            res.redirect('/')
        }
    } catch (err) {
        console.log(err)
        res.redirect('/500')

    }
}

// save address

function isValidMobile(mobile) {
    return mobile.length === 10;
}

const saveAddress = async (req, res) => {
    const { username, mobile, email, address, city, state, postcode, district } = req.body;
    const errors = [];
    const sourcePage = req.headers.referer;
    console.log(sourcePage)

    if (!username) {
        errors.push('Username is required');
    }
    if (!mobile) {
        errors.push('Phone Number is required');
    }
    if (!isValidMobile(mobile)) {
        errors.push('Phone Number is required');
    }
    if (!email) {
        errors.push('Email is required');
    }
    if (!address) {
        errors.push('Address is required');
    }
    if (!city) {
        errors.push('City is required');
    }
    if (!state) {
        errors.push('State is required');
    }
    if (!postcode) {
        errors.push('Postcode is required');
    }
    if (!district) {
        errors.push('District is required');
    }

    if (errors.length > 0) {
        const data = { errors, formData: req.body };
        if(sourcePage.includes('addaddress')){
            return res.render('User/pages/addaddress', data);
        }else if(sourcePage.includes('checkout')){
            const user = await UserDB.findById(req.session.user).populate('cart.product');
            const cartData = user.cart;
            const totalAmount = cartData.reduce((accumulator, item) => accumulator + item.totalAmount, 0);
            const address = await AddressDB.find({ userId: req.session.user })
            return res.render('User/pages/checkout', {data,address,cartData,user,totalAmount});
        }
    }
    try {
        const user = await UserDB.findById(req.session.user);
        const newaddress = new AddressDB({
            userId: req.session.user,
            username,
            email,
            mobile,
            address,
            city,
            state,
            postcode,
            district,
        });
        await newaddress.save();
        res.redirect('/address');
    } catch (error) {
        console.error(error);
        res.redirect('/500');
    }
};





// save edited password
const saveChangePassword = async (req, res) => {
    const { oldpassword, password, confirmpassword } = req.body

    try {
        const id = req.session.user;
        const user = await UserDB.findOne({ _id: id });
        // console.log(user)
        if (await bcrypt.compare(oldpassword, user.password)) {
            if (password === confirmpassword) {
                if (isValidPassword(password)) {
                    user.password = await bcrypt.hash(password, 10)
                    await user.save()
                    req.flash('error', 'Password Updated Successfully');
                    res.render('User/pages/changepassword')
                }
                else {
                    req.flash('error', 'Password Must include Symbol and numnber Capital and small charecters');
                    res.render('User/pages/changepassword')
                }
            } else {
                req.flash('error', 'Enter a Valied  Password ');
                res.render('User/pages/changepassword')
            }
        } else {
            req.flash('error', 'Old  Password is Wrong');
            res.render('User/pages/changepassword')
        }
    } catch (err) {
        res.redirect('/500')
    }
}

// edit address
const getEditAddress = async (req, res) => {
    try {
        const user = await UserDB.findById(req.session.user);
        const id = req.params.id;
        const address = await AddressDB.findById(id);
        res.render('User/pages/editaddress', { address, user })
    }
    catch (error) {
        res.redirect('/500')
    }
}

// save edited address
const updateAddress = async (req, res) => {
    let id = req.params.id;
    let data = req.body;
    const userId = req.session.user;
    const addOwner = await AddressDB.findOne({ userId, _id: id }).populate('userId', 'name email phoneNumber');
    const owner = await AddressDB.findOne({ userId, _id: id }).populate('userId', 'name email').select('userId');
    // console.log(addOwner,owner)
    if (!addOwner) {
        return res.redirect('/address')
    }
    await AddressDB.findByIdAndUpdate(id, data).then(() => {
        res.redirect("/address");
    }).catch((err) => {
        res.redirect('/500')
    })
}
// show order list
const loadOrderList = async (req, res) => {
    const ITEMS_PER_PAGE = 5;

    if (!req.session.user) {
        return res.redirect('/login');
    }

    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    try {
        const user = await UserDB.findById(req.session.user);
        const totalOrders = await OrderDB.countDocuments({ user: req.session.user });
        const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

        const order = await OrderDB.find({ user: req.session.user })
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(ITEMS_PER_PAGE);
        res.render('User/pages/orderlist', { order, currentPage: page, totalPages, user });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.redirect('/500')
    }
};







// load Order Details
const loadOrderDetails = async (req, res) => {
    try {
        const _id = req.params.id;
        const order = await OrderDB.findOne({ _id }).populate('products.product').populate('user')

        res.render("User/pages/orderdetails", { order });
    } catch (error) {
        res.redirect('/500')
    }
};


// add profile image
const uploadProfileImage = async (req, res) => {
    try {
        const userId = req.session.user;
        const imageData = {
            data: req.file.buffer,
            contentType: req.file.mimetype,
        };
        await UserDB.findByIdAndUpdate(userId, { profileImage: imageData });
        res.json({ success: true });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        res.redirect('/500')
    }
}

// delete Address
const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params
        const deleted = await AddressDB.findByIdAndDelete(id)
        if (deleted) {
            res.json({ success: true })
        }
        else {
            res.json({ success: false })
        }
    }
    catch (error) {
        res.redirect('/500')
    }
}


// load Wallet
const loadWallet = async (req, res) => {
    try {
        const ITEMS_PER_PAGE = 4;
        const page = req.query.page || 1;
        const userId = req.session.user;

        const user = await UserDB.findById(userId)
        user.walletHistory.sort((a, b) => b.date - a.date);

        const count = user.walletHistory.length;

        const startIndex = (page - 1) * ITEMS_PER_PAGE;

        const walletHistorySubset = user.walletHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        const totalPages = Math.ceil(count / ITEMS_PER_PAGE);

        if (req.session.user) {
            res.render('User/pages/wallet', { walletHistorySubset, user, currentPage: page, totalPages });
        }
    } catch (error) {
        console.log(error);
        res.redirect('/500')
    }
};

// load Coupens
const loadCoupen = async (req, res) => {
    try {
        const user = await UserDB.findById(req.session.user)
        const currentTimestamp = Date.now();
        const coupen = await CoupenDB.find({ startDate: { $lte: currentTimestamp }, expaireDate: { $gte: currentTimestamp } });
        res.render('User/pages/coupen', { coupen, user })
    } catch (error) {
        res.redirect('/500')
    }
}

//  load Wishlist
const loadWishlist = async (req, res) => {
    try {
        const user = await UserDB.findById(req.session.user).populate('wishlist.product')
        res.render('User/pages/wishlist', { user })
    } catch (err) {
        return res.status(400).send({ msg: "Error in Sending Data" });
    }
}


//addToWishlist
const addToWishlist = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(400).json({ success: false });
        }
        const id = req.params.id;
        const product = await ProductDB.findById(id);
        const user = await UserDB.findById(req.session.user).populate('wishlist.product')
        const wishlist = user.wishlist
        const existingProduct = wishlist.find(cartItem => cartItem.product.equals(id));
        if (existingProduct) {
            return res.status(403).json({ success: false });
        }
        await UserDB.updateOne(
            { _id: req.session.user },
            {
                $addToSet: {
                    wishlist: { product },
                },
            }
        );
        return res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.redirect('/500')
    }
};


// remove from whishlist
const removeFromWishlist = async (req, res) => {
    try {
        const id = req.params.id;
        await UserDB.updateOne({ _id: req.session.user }, { $pull: { wishlist: { product: id } } });
        res.json({ success: true })
    } catch (error) {
        res.json({ success: false })
        res.redirect('/500')
    }
}




module.exports = {
    loadprofile,
    loadAddress,
    loadChangePassword,
    saveEditProfile,
    loadAddAddress,
    saveAddress,
    saveChangePassword,
    getEditAddress,
    updateAddress,
    loadOrderList,
    loadOrderDetails,
    uploadProfileImage,
    deleteAddress,
    loadWallet,
    loadCoupen,
    loadWishlist,
    addToWishlist,
    removeFromWishlist

}