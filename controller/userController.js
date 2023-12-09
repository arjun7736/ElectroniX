const UserDB = require('../model/userModel');
const bcrypt = require('bcrypt');
const { render } = require('ejs');
const session = require("express-session")
const nodemailer = require('nodemailer');
const ProductDB = require('../model/productModel')
const CategoryDB = require('../model/categoryModel')
const SubCategoryDB = require('../model/subcategoryModel')
const BrandDB = require('../model/brandModel')
const OTPDB = require('../model/otpModel')
const axios = require('axios');
const registrationData = require('../util/temp')








// encrypting password

const securepassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash;
    } catch (error) {
        console.log(error.message)
    }
}


// load Login
const loadLogin = (req, res) => {
    res.render("User/pages/login", { error: null, email: null })
}
// load Register
const loadRegister = (req, res) => {
    res.render("User/pages/register", { error: null, email: null, username: null, mobile: null });
}
// load otp
const loadOtp = (req, res) => {
    const { email, username, password, mobile } = req.query;
    res.render('User/pages/otp', { email, username, password, mobile })
}


// load forgot password
const forgotPassword = (req, res) => {
    res.render("User/pages/forgotPassword");
}

// load landing
const loadLanding = async (req, res) => {
    try {
        const Products = await ProductDB.find({ isDelete: false }).limit(4)
        const SubCategory = await SubCategoryDB.find()
        res.render("User/pages/landing", { SubCategory, Products });
    }
    catch (error) {
        console.log(error.message)
    }
}





// load Products
const loadProducts = async (req, res) => {
    try {
        const sortBy = req.query.sort || 'default';

        let sortOptions;
        if (sortBy === 'priceLowToHigh') {
            sortOptions = { price: 1 };
        } else if (sortBy === 'priceHighToLow') {
            sortOptions = { price: -1 };
        } else {
            sortOptions = {}; 
        }

        const products = await ProductDB.find({ isDelete: false }).sort(sortOptions);
        const categoryCounts = await ProductDB.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ]);
        const subcategoryCounts = await ProductDB.aggregate([
            {
                $group: {
                    _id: "$subcategory",
                    count: { $sum: 1 }
                }
            }
        ]);
        const brandCounts = await ProductDB.aggregate([
            {
                $group: {
                    _id: "$brandname",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.render('User/pages/products', {
            products,
            subcategoryCounts,
            categoryCounts,
            brandCounts,
            sortBy 
        });
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Internal Server Error');
    }
};




// load Product Details
const loadProductDetails = async (req, res) => {
    const productId = req.params.productid;
    try {
        const produtDetail = await ProductDB.findOne({ _id: productId }, {})
        res.render('User/pages/productdetails', { produtDetail })
    }
    catch (error) {
        console.log(error.message)
    }
}





// sent otp
const sendOTP = async (email) => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log(otp)
    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL,
            pass: process.env.PASS
        }
    });

    const mailOptions = {
        from: process.env.MAIL, // Replace with your Gmail email address
        to: "arjunvengassery123@gmail.com",
        subject: 'OTP Verification',
        text: `Your OTP is: ${otp}. Use this OTP to verify your account.`
    };
    try {

        await transporter.sendMail(mailOptions);
        console.log('OTP sent successfully.');

        return otp; // Return the generated OTP for verification
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw error;
    }
};



const setRegistrationDataMiddleware = (req, res, next) => {
    const { username, email, password, mobile } = req.body;

    registrationData.setRegistrationData({ username, email, password, mobile });

    console.log(registrationData.getRegistrationData());

    next();
};



//validate and create new user data
const insertUser = async (req, res) => {
    const { username, email, password, confirmpassword, mobile } = req.body;

    const existingMail = await UserDB.findOne({ email: { $regex: new RegExp(email, 'i') } })
    if (existingMail) {
        return res.render('User/pages/register', { error: 'ExistingEmail', email: null, username, mobile })
    }
    if (email.trim() === '') {
        return res.render('User/pages/register', { error: 'EmailRequired', email: null, username, mobile });
    }
    if (username.trim() === '') {
        return res.render('User/pages/register', { error: 'UsernameRequired', email, username: null, mobile });
    }
    if (mobile.trim() === '' || mobile.length < 10) {
        return res.render('User/pages/register', { error: 'MobileRequired', email, username, mobile: null });
    }
    if (!isValidPassword(password)) {
        return res.render('User/pages/register', { error: 'InvalidPassword', email, username, mobile })
    }

    if (password === confirmpassword) {
        try {
            const OTP = await sendOTP(email)

            const otp = new OTPDB({
                otp: OTP,
                email: email
            })

            const newotp = await otp.save()
            res.render('User/pages/otp', { email })




        } catch (error) {
            console.log(error.message);
        }
    } else {
        return res.render('User/pages/register', { error: 'UnmatchingPassword', email, username, mobile })
    }
}



const verifyAndregister = async (req, res) => {
    // console.log(req.body)
    const { OTP, email } = req.body
    const user = await OTPDB.find({ email: email })
    const otp = user[0].otp
    // console.log(OTP, otp)

    if (OTP == otp) {
        const data = registrationData.getRegistrationData();
        const { username, email, password, mobile } = data;
        registrationData.clearRegistrationData();
        const spassword = await securepassword(password)
        const user = new UserDB({
            username,
            email,
            password: spassword,
            mobile
        })
        const userData = await user.save()
        if (userData) {
            const user = await UserDB.findOne({ email: email })
            console.log(user)
            req.session.user = user._id;
            console.log(req.session.user)
            res.redirect('/')
        }
    }
    else {
        req.flash('error', 'InValied OTP');
        console.log("Working error")
        res.render('User/pages/register')
    }
}





// user validation
const userValid = async (req, res, ) => {
    const { email, password,} = req.body;
    const Block=await UserDB.findOne({email:email})

    try {
        const user = await UserDB.findOne({ email });
        if (email.trim() === '') {
            return res.render('User/pages/login', { error: 'EmailRequired' });
        }

        if (password.trim() === '') {
            return res.render('User/pages/login', { error: 'PasswordRequired', email });
        }

        if (!isValidEmail(email)) {
            return res.render('User/pages/login', { error: 'EnterValiedEmail', email });
        }

        if (!user) {
            return res.render('User/pages/login', { error: 'UserNotFound', email: null });
        }

        if (Block.isBlocked) {
            return res.render('User/pages/login', { error: 'UserisBlocked', email: null });
        }

        if (user.password && (await bcrypt.compare(password, user.password))) {
            req.session.user = user._id;
            res.redirect('/');

        } else {
            return res.render('User/pages/login', { error: 'InvalidCredentials', email: null });
        }
    } catch (error) {
        console.log("Error validating user:", error.message);
        res.status(500).send('Internal Server Error');
    }
};



// check email is valied
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// check password is valied
function isValidPassword(password) {
    const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return passwordRegex.test(password);
}

// load resetpassword
const loadResetPasswordPage = (req, res) => {
    res.render('User/pages/forgotPassword')
}











module.exports = {
    loadLogin,
    loadRegister,
    insertUser,
    userValid,
    forgotPassword,
    loadLanding,
    loadProducts,
    loadProductDetails,
    verifyAndregister,
    loadOtp,
    setRegistrationDataMiddleware,
    loadResetPasswordPage,








}