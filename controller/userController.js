const UserDB = require('../model/userModel');
const bcrypt = require('bcrypt');
const { render } = require('ejs');
const session = require("express-session")

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
    res.render("User/pages/login")
}
// load Register
const loadRegister = (req, res) => {
    res.render("User/pages/register");
}

// load forgot password
const forgotPassword = (req, res) => {
    res.render("User/pages/forgotPassword");
}

// load landing
const loadLanding = async (req, res) => {
    try{
        const user=await UserDB.findById(req.session.user)
        console.log(user)
        res.render("User/pages/landing",{user});
    }
    catch(error){
        console.log(error.message)
    }
}

//create new user data
const insertUser = async (req, res) => {
    const { username, email, password, confirmpassword, mobile } = req.body;
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
        res.json({
            msg: "Re enter password"
        })
    }
}


// valied user
const userValid = async (req, res) => {
    const { email, password, isBlocked } = req.body;
    let error = null;
    try {

        const user = await UserDB.findOne({ email })
        if (!user) {
            error = 'UserNotFound';
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (isBlocked) {
            error = `UserisBlocked`
        }
        if (!isMatch) {
            error = 'InvalidCredentials';
        }

        if (error) {
            res.render('User/pages/login', { error });
        }

        req.session.user = user._id;
        return res.redirect('/landing')

    } catch (error) {
        console.log("user invalid")
        console.log(error.message);
    }
}














module.exports = {
     loadLogin, loadRegister, insertUser, userValid, forgotPassword, loadLanding
}