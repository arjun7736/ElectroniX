const express = require('express');
const userRoute = express.Router()
const Auth = require('../middleware/Authentication')
const userController = require('../controller/userController')
const ProductDB = require('../model/productModel')
const SubCategoryDB = require('../model/subcategoryModel');
const adminController = require('../controller/adminController');
const cartController = require('../controller/cartController');
const accountController =require('../controller/profileController')




userRoute.get('/register', Auth.isUserLoggedIn, userController.loadRegister)

userRoute.post('/register',userController.setRegistrationDataMiddleware, userController.insertUser)

userRoute.post('/otp', userController.verifyAndregister)

userRoute.get('/login', Auth.isUserLoggedIn, userController.loadLogin)

userRoute.post('/login', userController.userValid)

userRoute.get('/logout', Auth.logout)

userRoute.get('/', userController.loadLanding)

userRoute.get('/forgotPassword', userController.forgotPassword)

userRoute.get('/resetPassword', userController.loadResetPasswordPage)

userRoute.get('/products', userController.loadProducts)

userRoute.get('/productDetails/:productid',userController.loadProductDetails)

userRoute.get('/cart',cartController.loadCart)

userRoute.get('/account',accountController.loadprofile)

userRoute.post('/account',accountController.saveEditProfile)

userRoute.get('/address',accountController.loadAddress)

userRoute.get('/addaddress',accountController.loadAddAddress)

userRoute.post('/addaddress',accountController.saveAddress)

userRoute.get('/changepassword',accountController.loadChangePassword)

module.exports = userRoute
