const express = require('express');
const userRoute = express.Router()
const Auth = require('../middleware/Authentication')
const userController = require('../controller/userController')
const ProductDB = require('../model/productModel')
const SubCategoryDB = require('../model/subcategoryModel');
const adminController = require('../controller/adminController');
const cartController = require('../controller/cartController');
const accountController =require('../controller/profileController');
const ckeckoutController= require('../controller/checkOutController');
const multer = require('multer');
const upload = multer();


userRoute.get('/blocked',(req,res)=>res.render('User/pages/blocked'))

userRoute.get('/register', Auth.isUserLoggedIn, userController.loadRegister)

userRoute.post('/register',userController.setRegistrationDataMiddleware, userController.insertUser)

userRoute.post('/otp', userController.verifyAndregister)

userRoute.post('/resentotp',userController.resendOtp)

userRoute.get('/login',Auth.checkUserSession, Auth.isUserLoggedIn, userController.loadLogin)

userRoute.post('/login', userController.userValid)

userRoute.get('/logout', Auth.logout)

userRoute.get('/', userController.loadLanding)

userRoute.get('/forgotPassword', userController.forgotPassword)    //reset password from login page

userRoute.post('/forgotPassword', userController.verifyMailAndSentOTP) //senting otp and goto reset password page

userRoute.post('/passwordresetotp',userController.setEmailMiddleware,userController.verifyOTPAndResetPassword) //otp confirm and redirect into password entering  page

userRoute.get('/resetPassword', userController.loadResetPasswordPage) //loading reset password page

userRoute.post('/resetPassword', userController.saveAndResetPassword) //saving the edited password and redirecting into login page

userRoute.get('/products', userController.loadProducts)

userRoute.get('/productDetails/:productid',userController.loadProductDetails)

userRoute.get('/cart',Auth.isUserBlocked,cartController.loadCart)

userRoute.post('/addtocart',Auth.isUserBlocked,cartController.addToCart)

userRoute.post('/removeFromCart',cartController.deleteFromCart)

userRoute.post('/updateQuantity',cartController.updateQuantityInCart)

userRoute.get('/checkout',Auth.isUserBlocked,ckeckoutController.loadCheckout)

userRoute.post('/placeOrder',Auth.isUserBlocked, ckeckoutController.saveOrder)

userRoute.get('/orderSuccess',Auth.isUserBlocked,ckeckoutController.loadSuccess)

userRoute.get('/orderdetails/:id',accountController.loadOrderDetails)

userRoute.get('/account',Auth.isUserBlocked,accountController.loadprofile)

userRoute.post('/account',Auth.isUserBlocked,accountController.saveEditProfile)

userRoute.post('/uploadProfileImage',upload.single('image'),accountController.uploadProfileImage)

userRoute.get('/address',Auth.isUserBlocked,accountController.loadAddress)

userRoute.get('/addaddress',Auth.isUserBlocked,accountController.loadAddAddress)

userRoute.post('/addaddress',accountController.saveAddress)

userRoute.get('/editaddress/:id',Auth.isUserBlocked,accountController.getEditAddress)

userRoute.post('/editaddress/:id',accountController.updateAddress)

userRoute.get('/changepassword',Auth.isUserBlocked,accountController.loadChangePassword)

userRoute.post('/changepassword',accountController.saveChangePassword)

userRoute.get('/orderlist',Auth.isUserBlocked,accountController.loadOrderList)

userRoute.post('/cancelOrder/:id',ckeckoutController.cancelOrder)

userRoute.post('/cancelItem/:id/:id',ckeckoutController.cancelItem)

userRoute.post('/checkStock',ckeckoutController.checkStock)

module.exports = userRoute
