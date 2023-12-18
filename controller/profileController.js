const UserDB = require("../model/userModel");
const ProductDB = require("../model/productModel")
const AddressDB = require('../model/addressModel')
const bcrypt = require('bcrypt');
const OrderDB = require('../model/orderModel')


const securepassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash;
    } catch (error) {
        console.log(error.message)
    }
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
        console.log(id)
        const Address = await AddressDB.find({ userId: id })
        if (req.session.user) {
            res.render('User/pages/address', { Address })
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
        console.log(user)
        if (await bcrypt.compare(oldpassword, user.password)) {
            if (password === confirmpassword) {
                user.password = await bcrypt.hash(password, 10)
                await user.save()
                req.flash('error', 'Password Updated Successfully');
                res.render('User/pages/changepassword')
            } else {
                console.log("password and cnfirm pasword isint matching")
            }
        } else {
            console.log("Old pass is wrong")
        }
    } catch (err) {
        console.log(err)
    }
}

// edit address
const getEditAddress = async (req, res) => {
    const id = req.params.id;
    const address = await AddressDB.findById(id);
    res.render('User/pages/editaddress', { address })
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
    if(!req.session.user){
        return res.redirect('/login')
    }
    const order = await OrderDB.find({ user: req.session.user })
    res.render('User/pages/orderlist',{order})
}

const test= async (req,res)=>{
    const order = await OrderDB.find({ userId: req.session.user })
    // console.log(order)
    res.render('User/pages/test',{order})
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
    test


}