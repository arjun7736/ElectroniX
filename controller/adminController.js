const bcrypt = require('bcrypt');
const { render } = require('ejs');
const flash = require('express-flash');
const session = require("express-session")
const UserDB = require('../model/userModel')
const AdminDB = require('../model/adminModel')
const ProductDB = require('../model/productModel')
const BrandDB = require('../model/brandModel')
const OrderDB = require('../model/orderModel')
const CategoryDB = require('../model/categoryModel')
const SubCategoryDB = require('../model/subcategoryModel')
const crypto = require('crypto');
require('dotenv').config();
const multer = require('multer');
const upload = multer();
const { ObjectId } = require('mongoose').Types;
const mongoose = require('mongoose');
const sharp = require('sharp');
const fileUpload = require('express-fileupload');





// admin it is admin or not

const adminCheck = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await AdminDB.findOne({ email });

        if (email.trim() === '') {
            req.flash('error', 'Email Required');
            return res.render('Admin/pages/login');
        }

        if (password.trim() === '') {
            req.flash('error', 'Password Required');
            return res.render('Admin/pages/login');
        }

        if (!isValidEmail(email)) {
            req.flash('error', 'Enter Valied Email');
            return res.render('Admin/pages/login');
        }

        if (!admin) {
            req.flash('error', 'You Are Not Admin');
            return res.render('Admin/pages/login');
        }


        const isMatch = await bcrypt.compare(password, admin.password);

        if (isMatch) {
            req.session.admin = email;
            return res.redirect("/admin/dashboard");
        } else {
            req.flash('error', 'Invalid Credentials');
            return res.redirect("/admin/login");

        }
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send("Internal Server Error");
    }
};


// load login
const loadLogin = (req, res) => {
    res.render("Admin/pages/login", { error: null })
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// load userlist
const loadUser = async (req, res) => {
    const ITEMS_PER_PAGE = 7;
    try {
        const page = req.query.page || 1;
        const totalUsers = await UserDB.countDocuments();
        const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

        const userList = await UserDB.find()
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);

        res.render('Admin/pages/userlist', { userList, totalPages, currentPage: page });
    } catch (error) {
        console.error("Error fetching user list:", error);
        res.status(500).send('Internal Server Error');
    }
}


// load Dashboard
const loadDash = (req, res) => {
    res.render("Admin/pages/dashboard")
}

// load products
const loadProducts = async (req, res) => {
    const ITEMS_PER_PAGE = 7;

    try {
        const page = req.query.page || 1;
        const totalProducts = await ProductDB.countDocuments();
        const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
        const productList = await ProductDB.find({})
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE)
            .exec();
        res.render('Admin/pages/products', { productList, totalPages, currentPage: page });
    } catch (error) {
        console.error("Error fetching user list:", error);
        res.status(500).send('Internal Server Error');
    }
}


// load banner
const loadBanner = (req, res) => {
    res.render("Admin/pages/banner")
}


// load addbrand
const loadAddBrand = (req, res) => {
    res.render("Admin/pages/addbrands")
}



// load category
const loadCategory = async (req, res) => {
    try {
        const categoryList = await CategoryDB.find()
        const brandList = await BrandDB.find()
        const subcategoryList = await SubCategoryDB.find()
        // const CategoryDetails =await SubCategoryDB.find()
        res.render('Admin/pages/category', { brandList, categoryList, subcategoryList, })
    } catch (error) {
        console.error("Error fetching user list:", error);
        res.status(500).send('Internal Server Error');
    }
}



// load product details
const loadProductDetails = async (req, res) => {
    const productId = req.params.productid;
    try {
        const brand = await BrandDB.find()
        const category = await CategoryDB.find()
        const subcategory = await SubCategoryDB.find()
        const produtDetail = await ProductDB.findOne({ _id: productId }, {})
        // console.log(produtDetail);
        res.render('Admin/pages/editproducts', { produtDetail, brand, category, subcategory })
    }
    catch (error) {
        console.log(error.message)
    }
}

// save edit product
const saveEditProduct = async (req, res) => {
    const { brandname, category, subcategory, varientname, price, quantity, description } = req.body;
    const { productid } = req.params;

    try {

        const updateFields = {
            brandname: brandname,
            category: category,
            subcategory: subcategory,
            varientname: varientname,
            price: price,
            quantity: quantity,
            description: description,
        };

        const updatedProduct = await ProductDB.findByIdAndUpdate(
            productid,
            { $set: updateFields },
            { new: true }
        );

        if (!updatedProduct) {
            console.log("Error: Product not found");
            return res.status(404).json({ error: "Product not found" });
        }

        if (req.files) {
            for (const file of req.files) {
                if (!isValidImage(file)) {
                    console.log("Invalid image file type");
                    return res.status(400).json({ error: "Invalid image file type" });
                }

                const croppedBuffer = await sharp(file.buffer)
                    .resize({ width: 1000, height: 1000 })
                    .toBuffer();

                updatedProduct.images.push({
                    data: croppedBuffer,
                    contentType: file.mimetype,
                });
            }

            await updatedProduct.save();
        }

        return res.redirect("/admin/products");

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};



//soft delete product 

const softDeleteProduct = async (req, res) => {
    const { productid } = req.params;

    try {
        const filter = { _id: productid };
        const existingProduct = await ProductDB.findOne(filter);
        if (!existingProduct) throw "No such product exists";
        const updatedIsDelete = !existingProduct.isDelete;

        const update = {
            $set: { isDelete: updatedIsDelete }
        };

        const options = { upsert: true };
        await ProductDB.updateOne(filter, update, options);

        const productList = await ProductDB.find({ isDelete: false });
        return res.json("ok")
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
};



// delete Image
const deleteImage = async (req, res) => {
    let imageId = req.params.imageid
    const productId = req.params.productid
    console.log(req.params.productid);
    try {
        const deleteimg = await ProductDB.findByIdAndUpdate(
            { _id: productId },
            { $pull: { "images": { _id: imageId } } },
            { new: true }
        );
        res.status(200).json({ msg: 'Server ok' })
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
}






// add product
const loadAddproducts = async (req, res) => {
    try {
        const brand = await BrandDB.find()
        const category = await CategoryDB.find()
        const subcategory = await SubCategoryDB.find()
        res.render('Admin/pages/addproducts', { brand, category, subcategory, })
    }
    catch (error) {
        console.error("Error fetching user list:", error);
        res.status(500).send('Internal Server Error');
    }

}





// save products
const addProduct = async (req, res) => {
    const { brandname, category, subcategory, varientname, price, quantity, description } = req.body;

    try {
        const existingProduct = await ProductDB.findOne({ brandname, varientname });

        if (existingProduct) {
            req.flash('error', `A product with ${brandname}&${varientname} is already exists`);

            const brand = await BrandDB.find();
            const category = await CategoryDB.find();
            const subcategory = await SubCategoryDB.find();
            return res.render('Admin/pages/addproducts', { brand, category, subcategory });
        } else {
            const product = new ProductDB({
                brandname,
                category,
                subcategory,
                varientname,
                price,
                quantity,
                description
            });

            for (const file of req.files) {
                if (!isValidImage(file)) {
                    req.flash('error', 'Invalid image file type.');
                    const brand = await BrandDB.find();
                    const category = await CategoryDB.find();
                    const subcategory = await SubCategoryDB.find();
                    return res.render('Admin/pages/addproducts', { brand, category, subcategory });
                }

                const croppedBuffer = await sharp(file.buffer)
                    .resize({ width: 1000, height: 1000 })
                    .toBuffer();

                product.images.push({
                    data: croppedBuffer,
                    contentType: file.mimetype,
                });
            }

            const newproduct = await product.save();

            if (newproduct) {
                req.flash('success', 'Product added successfully.');
                return res.redirect('/admin/products');
            } else {
                console.log("Error: Product not saved");
                return res.status(500).json({ error: "Internal Server Error" });
            }
        }
    } catch (error) {
        console.log("Error Occurred:", error.message);
        return res.status(500).json({ error: "Catch Server Error" });
    }
};

function isValidImage(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    return allowedTypes.includes(file.mimetype);
}






// add brands
const addBrands = async (req, res) => {
    const { brandname } = req.body
    try {
        const brand = await BrandDB.findOne({ brandname: { $regex: new RegExp(brandname, 'i') } })

        if (!brand) {
            const Brand = new BrandDB({
                brandname
            })
            const newBrand = await Brand.save()
            if (newBrand) {
                return res.redirect('/admin/category')
            }
        } else {
            req.flash('error', `${brandname} is already exists`)
            res.render('Admin/pages/addbrands')
        }
    } catch {
        console.log("Error Occured")
    }
}



// load add subcategory
const loadAddSubCategory = (req, res) => {
    res.render('Admin/pages/addsubcategory')
}


// load add category
const loadAddCategory = (req, res) => {
    res.render('Admin/pages/addcategory')
}


// add category
const addCategory = async (req, res) => {
    const { categoryname } = req.body
    try {
        const category = await CategoryDB.findOne({ categoryname: { $regex: new RegExp(categoryname, 'i') } })
        if (!category) {
            const Category = new CategoryDB({
                categoryname
            })
            const newCategory = await Category.save()
            if (newCategory) {
                return res.redirect('/admin/category')
            }
        } else {
            req.flash('error', `${categoryname} is already exists`)
            return res.render('Admin/pages/addcategory');
        }
    } catch {
        console.log("Error Occured")
    }
}


// add sub category
const addSubCategory = async (req, res) => {
    const { subcategoryname } = req.body
    try {
        const subcategory = await SubCategoryDB.findOne({ subcategoryname: { $regex: new RegExp(subcategoryname, 'i') } })
        if (!subcategory) {
            const SubCategory = new SubCategoryDB({
                subcategoryname
            })
            const newCategory = await SubCategory.save()
            if (newCategory) {
                return res.redirect('/admin/category')
            }
        } else {
            req.flash('error', `${subcategoryname} is already exists`)

            return res.render('Admin/pages/addsubcategory');
        }
    } catch {
        console.log("Error Occured")
    }
}



// userBlock and unblock
const toggleBlockUser = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await UserDB.findById(userId);

        user.isBlocked = !user.isBlocked;
        const updatedUser = await user.save();

        res.json(updatedUser);

    } catch (error) {
        console.error('Error toggling user block:', error);
        res.status(500).json({ error: 'Error toggling user block' });
    }
};


// load category edit details
const getEditCategory = async (req, res) => {
    let id = req.params.productid;
    try {
        const CategoryDetails = await CategoryDB.findById(id);
        res.render('Admin/pages/editcategory', { CategoryDetails });
    }
    catch {
        console.log('getEditCategory Error')
    }
}
// save updated category
const saveUpdateCategory = async (req, res) => {
    let category = req.body.categoryname;
    const productid = req.params.productid;
    try {
        const existingCategory = await CategoryDB.findOne({
            categoryname: { $regex: new RegExp(category, 'i') }
        });
        console.log(existingCategory)
        if (!existingCategory || existingCategory._id.equals(productid)) {
            const updateFields = {
                categoryname: category
            };

            const updatedProduct = await CategoryDB.findByIdAndUpdate(
                productid,
                { $set: updateFields },
                { new: true }
            );

            if (updatedProduct) {
                await updatedProduct.save();
                return res.redirect("/admin/category");
            }
        } else {
            const CategoryDetails = await CategoryDB.findById(productid);
            req.flash('error', `${category} is already exists`)
            return res.render('Admin/pages/editcategory', { CategoryDetails });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
};





// get edit brand
const getEditBrand = async (req, res) => {
    let id = req.params.productid;
    try {
        const BrandDetails = await BrandDB.findById(id);
        res.render('Admin/pages/editbrand', { BrandDetails })
    }
    catch {
        console.log('Error in getting brand Details');
    }
}


// save EditBrand
const saveUpdateBrand = async (req, res) => {
    let name = req.body.brandname;
    const productid = req.params.productid;
    try {
        const brand = await BrandDB.findOne({ brandname: { $regex: new RegExp(name, 'i') } })
        console.log(!brand)

        if (!brand || brand._id.equals(productid)) {
            const updateFields =
            {
                brandname: name
            }
            const updatedProduct = await BrandDB.findByIdAndUpdate(
                productid,
                { $set: updateFields },
                { new: true }
            );

            if (updatedProduct) {
                await updatedProduct.save();
                console.log("Brand edited successfully.");
                return res.redirect("/admin/category")
            }
        }
        else {
            const BrandDetails = await BrandDB.findById(productid);
            req.flash('error', `${name} is already exists`)
            return res.render('Admin/pages/editbrand', { BrandDetails });
        }
    }
    catch (error) {
        console.log(error)
    }
}



// load subcategory edit details
const getEditSubCategory = async (req, res) => {
    let id = req.params.productid;
    try {
        const SubCategoryDetails = await SubCategoryDB.findById(id);
        res.render('Admin/pages/editsubcategory', { SubCategoryDetails });
    }
    catch {
        console.log('getEditCategory Error')
    }
}


// save edit subcategory
const saveUpdateSubCategory = async (req, res) => {
    let subcategory = req.body.subcategoryname;
    const productid = req.params.productid;
    try {

        const existingsubcategory = await SubCategoryDB.findOne({
            subcategoryname: { $regex: new RegExp(subcategory, 'i') }
        });
        if (!existingsubcategory || existingsubcategory._id.equals(productid)) {

            const updateFields =
            {
                subcategoryname: subcategory
            }
            const updatedProduct = await SubCategoryDB.findByIdAndUpdate(
                productid,
                { $set: updateFields },
                { new: true }
            );
            await updatedProduct.save();
            if (updatedProduct) {
                console.log("Sub Category edited successfully.");
                return res.redirect("/admin/category")
            }
        }
        else {
            const SubCategoryDetails = await SubCategoryDB.findById(productid);
            req.flash('error', `${subcategory} is already exists`)
            return res.render('Admin/pages/editsubcategory', { SubCategoryDetails });
        }
    }
    catch (error) {
        console.log(error)
    }
}



// load orderlist
const loadOrderList = async (req, res) => {
    const ITEMS_PER_PAGE = 5;
    try {
        if (!req.session.admin) {
            res.redirect('/login')
        } else {
            const page = req.query.page || 1;

            const totalOrders = await OrderDB.countDocuments();
            const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);
            const OrderData = await OrderDB.find()
                .sort([['orderDate', 'descending']])
                .populate('user')
                .populate('products.product')
                .populate('deliveryAddress')
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
                .exec();
            res.render('Admin/pages/orderlist', { OrderData, totalPages, currentPage: page });
        }
    } catch (error) {
        console.log(error)
    }
}


// change status
const changeDeliveryStatus = async (req, res) => {
    try {
        const userId = req.params.userId;
        const newStatus = req.body.newStatus;
        if (newStatus == 'Delivered') {
            const updatedUser = await OrderDB.findByIdAndUpdate(userId, { status: newStatus, deliverdAt: Date.now(),paymentStatus:'Paid' }, { new: true });
            console.log(updatedUser.status)
            const status =updatedUser.status
            res.json({ success: true, status });
            
        }
        else {
            const updatedUser = await OrderDB.findByIdAndUpdate(userId, { status: newStatus }, { new: true });
            const status =updatedUser.status

            res.json({ success: true, status });
        }
        
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


// orderDetails
const orderDetails = async (req, res) => {
    const { id } = req.params;
    try {
        // get the order details
        const order = await OrderDB.findById(id).populate('user').populate('products.product');
        res.render("Admin/pages/orderDetails", { order });
    } catch (err) {
        console.log(err);
        res.send('An error occurred while fetching the data!')
    }

}

// update Quantity
// const updateQuantity = async (req, res) => {
//     const { itemID, orderid } = req.body;
//     const userId = req.session.user;

//     try {
//         const pro = await ProductDB.findOne({ _id: itemID });
//         const userBeforeUpdate = await OrderDB.findOne({ _id: orderid, 'products.product': itemID });
//         console.log(userBeforeUpdate)
//         if (!userBeforeUpdate) {
//             return res.status(404).json({ message: 'User not found or product not in cart' });
//         }

//             const updatedQuantity = parseInt(quantity);
//             const previousQuantity = userBeforeUpdate.cart.find(item => item.product.equals(product)).quantity;

//             const updatedUser = await UserDB.findOneAndUpdate(
//                 { _id: userId, 'cart.product': product },
//                 {
//                     $set: {
//                         'cart.$.quantity': updatedQuantity,
//                     },
//                     $inc: {
//                         'cart.$.totalAmount': pro.price * (updatedQuantity - previousQuantity),
//                         'grandTotal': pro.price * (updatedQuantity - previousQuantity),
//                     },
//                 },
//                 { new: true }
//             );

//             res.json({
//                 message: 'Quantity updated',
//                 quantity: updatedUser.cart.find(item => item.product.equals(product)).quantity,
//                 totalAmount: updatedUser.cart.find(item => item.product.equals(product)).totalAmount,
//                 grandtotal: updatedUser.grandTotal
//             });
//     } catch (error) {
//             console.error('Error updating quantity:', error);
//             res.status(500).json({ message: 'Failed to update quantity' });
//     }
// };


const updateQuantity = async (req, res) => {
    try {
        const { orderId, productId, newQuantity } = req.body;
        // Find the order by orderId
        const order = await OrderDB.findById(orderId)

        const productToUpdate = order.products.find(product => product.product.toString() === productId);

        // Update the product details
        const product = await ProductDB.findById(productId)

        productToUpdate.quantity = newQuantity;
        productToUpdate.totalAmount = product.price * newQuantity;

        // Recalculate grandTotal based on updated product details
        // order.grandTotal = order.products.reduce((total, product) => total + product.totalAmount, 0);
        order.grandTotal = order.products
            .filter(product => !product.itemCancelled)
            .reduce((total, product) => total + product.totalAmount, 0);


        order.totalPrice = order.products
            .filter(product => !product.itemCancelled)
            .reduce((total, product) => total + product.totalAmount, 0);


        console.log(order.grandTotal)
        // Save the updated order
        await order.save();

        res.json({ success: true, order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}









module.exports = {
    adminCheck,
    loadLogin,
    loadUser,
    loadDash,
    addProduct,
    toggleBlockUser,
    loadProducts,
    loadBanner,
    loadCategory,
    loadAddproducts,
    addBrands,
    addCategory,
    addSubCategory,
    loadProductDetails,
    saveEditProduct,
    softDeleteProduct,
    deleteImage,
    loadAddBrand,
    loadAddSubCategory,
    getEditCategory,
    saveUpdateCategory,
    getEditBrand,
    saveUpdateBrand,
    getEditSubCategory,
    saveUpdateSubCategory,
    loadAddCategory,
    loadOrderList,
    changeDeliveryStatus,
    orderDetails,
    updateQuantity




}