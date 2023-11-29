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
    res.render("User/pages/login", { error: null ,email:null})
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
    try {
        const user = await UserDB.findById(req.session.user)
        console.log(user)
        res.render("User/pages/landing", { user });
    }
    catch (error) {
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






// user validation
const userValid = async (req, res) => {
    const { email, password, isBlocked } = req.body;
    try {
        const user = await UserDB.findOne({ email });
        if (email.trim() === '') {
            return res.render('User/pages/login', { error: 'EmailRequired' });
        }

        if (password.trim() === '') {
            return res.render('User/pages/login', { error: 'PasswordRequired' ,email});
        }

        if (!isValidEmail(email)) {
          return res.render('User/pages/login', { error: 'EnterValiedEmail' ,email});
        }

        if (!user) {
            return res.render('User/pages/login', { error: 'UserNotFound' ,email:null});
        }

        if (isBlocked) {
            return res.render('User/pages/login', { error: 'UserisBlocked',email:null });
        }

        if (user.password && (await bcrypt.compare(password, user.password))) {
            req.session.user = user._id;
            return res.redirect('/landing');
        } else {
            return res.render('User/pages/login', { error: 'InvalidCredentials',email:null });
        }
    } catch (error) {
        console.log("Error validating user:", error.message);
        res.status(500).send('Internal Server Error');
    }
};

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}










module.exports = {
    loadLogin, loadRegister, insertUser, userValid, forgotPassword, loadLanding
}