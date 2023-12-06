const express = require('express');
const userRoute = express.Router()
const Auth = require('../middleware/Authentication')
const userController = require('../controller/userController')
const ProductDB = require('../model/productModel')
const SubCategoryDB = require('../model/subcategoryModel');
const adminController = require('../controller/adminController');





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



module.exports = userRoute
