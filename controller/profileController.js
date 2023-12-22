const UserDB = require("../model/userModel");
const ProductDB = require("../model/productModel")
const AddressDB = require('../model/addressModel')
const bcrypt = require('bcrypt');
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
            res.render('User/pages/address', { Address ,user})
        } else {
            console.log("poyi login cheyyeda")
            res.redirect('/login')
        }
    }
    catch (err) {
        console.log(err)
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
        res.status(500).json({ error: 'Internal Server Error' });
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
    }
}

// save address
const saveAddress = async (req, res) => {
    const { username, mobile, email, address, city, state, postcode, district } = req.body
    console.log(req.body)
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
        })
        await newaddress.save();
        res.status(200).json({ message: 'Address added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}






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
        console.log(err)
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
        console.log(error)
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
        console.log(err);
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
            .skip(skip)
            .limit(ITEMS_PER_PAGE);
        res.render('User/pages/orderlist', { order, currentPage: page, totalPages ,user});
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Internal Server Error');
    }
};







// load Order Details
const loadOrderDetails = async (req, res) => {
    try {
        const _id = req.params.id;
        const order = await OrderDB.findOne({ _id }).populate('products.product').populate('user')

        res.render("User/pages/orderdetails", { order });
    } catch (error) {
        console.log(error);
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
        res.status(500).json({ success: false, message: 'Internal Server Error' });
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



}