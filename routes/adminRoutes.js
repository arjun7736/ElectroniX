const express = require('express');
const adminRoute =express.Router()
const adminController = require("../controller/adminController")
const Auth = require("../middleware/Authentication")
const multer= require('multer')
const storage =multer.memoryStorage()
const upload =multer({storage:storage})







//------------------------------login Route  --------------------------

adminRoute.get('/login',Auth.isAdminLoggedIn,adminController.loadLogin)

adminRoute.post('/login',adminController.adminCheck)

//------------------------------Dashboard Route  --------------------------

adminRoute.get('/dashboard',Auth.isAdminLoggedIn,adminController.loadDash)

adminRoute.get('/userlist',Auth.isAdminLoggedIn,adminController.loadUser);

adminRoute.post("/userlist/block/:id",adminController.toggleBlockUser)

adminRoute.get('/category',Auth.isAdminLoggedIn,adminController.loadCategory)

adminRoute.get('/addcategory',Auth.isAdminLoggedIn,adminController.loadAddCategory)

adminRoute.post('/addcategory',adminController.addCategory)

adminRoute.get('/editcategory/:productid',Auth.isAdminLoggedIn,adminController.getEditCategory)

adminRoute.post('/editcategory/:productid',adminController.saveUpdateCategory)


adminRoute.get('/addbrands',Auth.isAdminLoggedIn,adminController.loadAddBrand)

adminRoute.post('/addbrands',adminController.addBrands)


adminRoute.get('/editbrand/:productid',Auth.isAdminLoggedIn,adminController.getEditBrand)

adminRoute.post('/editbrand/:productid',adminController.saveUpdateBrand)


adminRoute.get('/products',Auth.isAdminLoggedIn,adminController.loadProducts)

adminRoute.get('/addproducts',Auth.isAdminLoggedIn,adminController.loadAddproducts)

adminRoute.post('/addproducts',upload.array('images',3),adminController.addProduct)

adminRoute.get('/editproducts/:productid',Auth.isAdminLoggedIn,adminController.loadProductDetails)

adminRoute.post('/editproducts/:productid',upload.array('images',3),adminController.saveEditProduct)

adminRoute.post('/deleteproduct/:productid',adminController.softDeleteProduct)

adminRoute.post('/deleteimage/:imageid/:productid',adminController.deleteImage)



adminRoute.get('/addsubcategory',Auth.isAdminLoggedIn,adminController.loadAddSubCategory)

adminRoute.post('/addsubcategory',adminController.addSubCategory)

adminRoute.get('/editsubcategory/:productid',Auth.isAdminLoggedIn,adminController.getEditSubCategory)

adminRoute.post('/editsubcategory/:productid',adminController.saveUpdateSubCategory)

adminRoute.get('/orderlist',Auth.isAdminLoggedIn,adminController.loadOrderList)

adminRoute.get('/orderDetails/:id',Auth.isAdminLoggedIn,adminController.orderDetails)

adminRoute.post('/orderlist/updateStatus/:userId', adminController.changeDeliveryStatus);

adminRoute.get('/coupens',Auth.isAdminLoggedIn,adminController.loadCoupens)

adminRoute.get('/addcoupen',Auth.isAdminLoggedIn,adminController.loadaddCoupen)

adminRoute.post('/addcoupen',adminController.addCoupon)

adminRoute.get('/editcoupen/:id',Auth.isAdminLoggedIn,adminController.loadeditCoupen)

adminRoute.post('/editcoupen/:id',adminController.saveEditCoupen)

adminRoute.post('/deleteCoupen/:id',adminController.deleteCoupon)

adminRoute.get('/salesReport',adminController.loadsalesReport)

adminRoute.post('/salesReport',adminController.salesReport)

module.exports = adminRoute
