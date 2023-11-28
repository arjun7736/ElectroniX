const express = require('express');
const userRoute = express.Router()
const Auth =require('../middleware/Authentication')
const userController = require('../controller/userController')







userRoute.get('/register',Auth.isUserLoggedIn,userController.loadRegister)

userRoute.post('/register',userController.insertUser)

userRoute.get('/login',Auth.isUserLoggedIn,userController.loadLogin)

userRoute.post('/login',userController.userValid)

userRoute.get('/logout',Auth.logout,(req,res)=>res.redirect('/login'))

userRoute.get('/landing',Auth.isUserLoggedIn,userController.loadLanding)

userRoute.get('/forgotPassword',Auth.isUserLoggedIn,userController.forgotPassword)

userRoute.get('/resetPassword',Auth.isUserLoggedIn,(req,res)=>res.render('User/pages/resetPassword'))

userRoute.post('/otp',(req,res)=>res.render('User/pages/otp'))

userRoute.get('/otp',(req,res)=>res.render('User/pages/otp'))

userRoute.get('/products',(req,res)=>res.render('User/pages/products'))

userRoute.get('/productDetails',(req,res)=>res.render('User/pages/productdetails'))



module.exports = userRoute
 