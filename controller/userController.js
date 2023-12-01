const UserDB = require('../model/userModel');
const bcrypt = require('bcrypt');
const { render } = require('ejs');
const session = require("express-session")
const ProductDB = require('../model/productModel')
const CategoryDB = require('../model/categoryModel')
const SubCategoryDB = require('../model/subcategoryModel')
const BrandDB = require('../model/brandModel')
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

// load forgot password
const forgotPassword = (req, res) => {
    res.render("User/pages/forgotPassword");
}

// load landing
const loadLanding = async (req, res) => {
    try {

        res.render("User/pages/landing");
    }
    catch (error) {
        console.log(error.message)
    }
}


// load Products
const loadProducts = async (req, res) => {
    try {
        const products = await ProductDB.find();
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
            }])
        const brandCounts = await ProductDB.aggregate([
            {
                $group: {
                    _id: "$brandname",
                    count: { $sum: 1 }
                }
            }])
        res.render('User/pages/products', { products, subcategoryCounts, categoryCounts, brandCounts })
    } catch (err) {
        console.log(err.message)
    }
}



// load Product Details
const  loadProductDetails = async (req, res) => {
    // console.log(req.body)
    const productId = req.params.productid;
   console.log(productId)
        try {
            const produtDetail = await ProductDB.findOne({ _id: productId }, {})
            // console.log(produtDetail)
            res.render('User/pages/productdetails', { produtDetail })

        }
        catch (error) {
            console.log(error.message)
        }
}





//validate and create new user data
const insertUser = async (req, res) => {
    const { username, email, password, confirmpassword, mobile } = req.body;
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
            const spassword = await securepassword(password)
            const user = new UserDB({
                username,
                email,
                password: spassword,
                mobile
            })
            const userData = await user.save()
            if (userData) {
                res.redirect('/landing')

                req.session.user = user._id;

            } else {
                res.render('User/pages/register')
            }


        } catch (error) {
            console.log(error.message);
        }
    } else {
        return res.render('User/pages/register', { error: 'UnmatchingPassword', email, username, mobile })
    }
}



// user validation
const userValid = async (req, res) => {
    const { email, password, isBlocked } = req.body;
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

        if (isBlocked) {
            return res.render('User/pages/login', { error: 'UserisBlocked', email: null });
        }

        if (user.password && (await bcrypt.compare(password, user.password))) {
            req.session.user = user._id;
            return res.redirect('/landing');
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








module.exports = {
    loadLogin,
    loadRegister,
    insertUser,
    userValid,
    forgotPassword,
    loadLanding,
    loadProducts,
    loadProductDetails,
    
}