const express = require('express');
const adminRoute =express.Router()
const adminController = require("../controller/adminController")
const Auth = require("../middleware/Authentication")

adminRoute.get('/login',Auth.isAdminLoggedIn,adminController.loadDash)

adminRoute.post('/login',adminController.adminCheck)

adminRoute.get('/dashboard',Auth.isAdminLoggedIn,adminController.loadDash)

adminRoute.get('/userlist',Auth.isAdminLoggedIn,adminController.loadUser);

// adminRoute.post("/userlist/unblock/:id",adminController.toggleBlockUser)

adminRoute.post("/userlist/block/:id",adminController.toggleBlockUser)


adminRoute.get('/banner',Auth.isAdminLoggedIn,adminController.loadBanner)

adminRoute.get('/category',Auth.isAdminLoggedIn,adminController.loadCategory)

adminRoute.get('/addcategory',(req,res)=>{res.render('Admin/pages/addcategory')})

adminRoute.post('/addcategory',adminController.addCategory)

adminRoute.get('/addbrands',(req,res)=>{res.render('Admin/pages/addbrands')})

adminRoute.post('/addbrands',adminController.addBrands)

adminRoute.get('/products',Auth.isAdminLoggedIn,adminController.loadProducts)

adminRoute.get('/addproducts',Auth.isAdminLoggedIn,adminController.loadAddproducts)

adminRoute.post('/addproducts',adminController.addProduct)

module.exports = adminRoute
