const express = require('express');
const adminRoute =express.Router()
const adminController = require("../controller/adminController")
const Auth = require("../middleware/Authentication")
const multer= require('multer')
const storage =multer.memoryStorage()
const upload =multer({storage:storage})








adminRoute.get('/login',Auth.isAdminLoggedIn,adminController.loadLogin)

adminRoute.post('/login',adminController.adminCheck)

adminRoute.get('/dashboard',Auth.isAdminLoggedIn,adminController.loadDash)

adminRoute.get('/userlist',Auth.isAdminLoggedIn,adminController.loadUser);

adminRoute.post("/userlist/block/:id",adminController.toggleBlockUser)

adminRoute.get('/banner',Auth.isAdminLoggedIn,adminController.loadBanner)

adminRoute.get('/category',adminController.loadCategory)

adminRoute.get('/addcategory',adminController.loadAddCategory)

adminRoute.post('/addcategory',adminController.addCategory)

adminRoute.get('/editcategory/:productid',adminController.getEditCategory)

adminRoute.post('/editcategory/:productid',adminController.saveUpdateCategory)


adminRoute.get('/addbrands',Auth.isAdminLoggedIn,adminController.loadAddBrand)

adminRoute.post('/addbrands',adminController.addBrands)


adminRoute.get('/editbrand/:productid',adminController.getEditBrand)

adminRoute.post('/editbrand/:productid',adminController.saveUpdateBrand)



adminRoute.get('/products',Auth.isAdminLoggedIn,adminController.loadProducts)

adminRoute.get('/addproducts',Auth.isAdminLoggedIn,adminController.loadAddproducts)

adminRoute.post('/addproducts',upload.array('images',3),adminController.addProduct)

adminRoute.get('/editproducts/:productid',adminController.loadProductDetails)

adminRoute.post('/editproducts/:productid',upload.array('images',3),adminController.saveEditProduct)

adminRoute.post('/deleteproduct/:productid',adminController.softDeleteProduct)

adminRoute.post('/deleteimage/:productid',adminController.deleteImage)



adminRoute.get('/addsubcategory',Auth.isAdminLoggedIn,adminController.loadAddSubCategory)

adminRoute.post('/addsubcategory',adminController.addSubCategory)


adminRoute.get('/editsubcategory/:productid',adminController.getEditSubCategory)

adminRoute.post('/editsubcategory/:productid',adminController.saveUpdateSubCategory)




module.exports = adminRoute
