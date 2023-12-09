const UserDB = require("../model/userModel");
const ProductDB = require("../model/productModel")
const AddressDB = require('../model/addressModel')

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
        const id=req.session.user;
        console.log(id)
        const Address = await AddressDB.find({userId:id})
        console.log(Address)
        if (req.session.user) {
            res.render('User/pages/address',{Address})
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
    if (req.session.user) {
        res.render('User/pages/changePassword')
    } else {
        console.log("poyi login cheyyeda")
        res.redirect('/login')
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
            res.render('User/pages/addaddress')
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
            userId:req.session.user,
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



module.exports = {
    loadprofile,
    loadAddress,
    loadChangePassword,
    saveEditProfile,
    loadAddAddress,
    saveAddress

}