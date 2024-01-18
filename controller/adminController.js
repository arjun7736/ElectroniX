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
const CoupenDB = require('../model/coupenModel')
const crypto = require('crypto');
require('dotenv').config();
const multer = require('multer');
const upload = multer();
const { ObjectId } = require('mongoose').Types;
const mongoose = require('mongoose');
const sharp = require('sharp');
const fileUpload = require('express-fileupload');
const XLSX = require('xlsx');






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
        return res.redirect('/admin/500')
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
        return res.redirect('/admin/500')
    }
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
        return res.redirect('/admin/500')
    }
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
        return res.redirect('/admin/500')
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
        return res.redirect('/admin/500')
    }
}

// save edit product
const saveEditProduct = async (req, res) => {
    const { brandname, category, subcategory, varientname, price, quantity, description, offer } = req.body;
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
            offer: offer
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
        return res.redirect('/admin/500')
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
        return res.redirect('/admin/500')
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
        return res.redirect('/admin/500')
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
        return res.redirect('/admin/500')
    }

}





// save products
const addProduct = async (req, res) => {
    const { brandname, category, subcategory, varientname, price, quantity, description, offer } = req.body;

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
                description,
                offer
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
                return res.redirect('/admin/500')
            }
        }
    } catch (error) {
        console.log("Error Occurred:", error.message);
        return res.redirect('/admin/500')
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
        return res.redirect('/admin/500')
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
    const { categoryname, offer } = req.body
    try {
        const category = await CategoryDB.findOne({ categoryname: { $regex: new RegExp(categoryname, 'i') } })
        if (!category) {
            const Category = new CategoryDB({
                categoryname,
                offer
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
        return res.redirect('/admin/500')
    }
}


// add sub category
const addSubCategory = async (req, res) => {
    const { subcategoryname, offer } = req.body
    try {
        const subcategory = await SubCategoryDB.findOne({ subcategoryname: { $regex: new RegExp(subcategoryname, 'i') } })
        if (!subcategory) {
            const SubCategory = new SubCategoryDB({
                subcategoryname, offer
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
        return res.redirect('/admin/500')
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
        return res.redirect('/admin/500')
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
        return res.redirect('/admin/500')

    }
}
// save updated category
const saveUpdateCategory = async (req, res) => {
    let { category, offer } = req.body;
    const productid = req.params.productid;
    try {
        const existingCategory = await CategoryDB.findOne({
            categoryname: { $regex: new RegExp(category, 'i') }
        });
        console.log(existingCategory)
        if (!existingCategory || existingCategory._id.equals(productid)) {
            const updateFields = {
                categoryname: category,
                offer: offer
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
        return res.redirect('/admin/500')
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
        return res.redirect('/admin/500')
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
        return res.redirect('/admin/500')
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
        return res.redirect('/admin/500')
    }
}


// save edit subcategory
const saveUpdateSubCategory = async (req, res) => {
    let { subcategoryname, offer } = req.body;
    const productid = req.params.productid;
    try {

        const existingsubcategory = await SubCategoryDB.findOne({
            subcategoryname: { $regex: new RegExp(subcategoryname, 'i') }
        });
        console.log(existingsubcategory)
        if (!existingsubcategory || existingsubcategory._id.equals(productid)) {

            const updateFields =
            {
                subcategoryname: subcategoryname,
                offer: offer
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
        return res.redirect('/admin/500')
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
        return res.redirect('/admin/500')
    }
}


// change status
const changeDeliveryStatus = async (req, res) => {
    try {
        const userId = req.params.userId;
        const newStatus = req.body.newStatus;
        if (newStatus == 'Delivered') {
            const updatedUser = await OrderDB.findByIdAndUpdate(userId, { status: newStatus, deliverdAt: Date.now(), paymentStatus: 'Paid' }, { new: true });
            console.log(updatedUser.status)
            const status = updatedUser.status
            res.json({ success: true, status });

        }
        else {
            const updatedUser = await OrderDB.findByIdAndUpdate(userId, { status: newStatus }, { new: true });
            const status = updatedUser.status

            res.json({ success: true, status });
        }

    } catch (error) {
        console.error('Error updating user status:', error);
        return res.redirect('/admin/500')
    }
};


// orderDetails
const orderDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const order = await OrderDB.findById(id).populate('user').populate('products.product');
        res.render("Admin/pages/orderDetails", { order });
    } catch (err) {
        console.log(err);
        res.send('An error occurred while fetching the data!')
    }

}

// Load  coupens
const loadCoupens = async (req, res) => {
    try {
        const coupen = await CoupenDB.find()
        res.render('Admin/pages/coupens', { coupen })
    }
    catch (error) {
        return res.redirect('/admin/500')
    }
}
// loadaddCoupen
const loadaddCoupen = (req, res) => {
    try {
        res.render('Admin/pages/addcoupen')
    }
    catch (error) {
        return res.redirect('/admin/500')
    }
}

// add coupen
const addCoupon = async (req, res) => {
    try {
        let { coupenname, discounttype, minpurchase, discountamountorpercentage, code, description, startdate, enddate } = req.body;
        if (enddate < startdate) {
            req.flash('error', 'End Date Must Greater than The Start Date');
            return res.render('Admin/pages/addcoupen')
        }
        const existCode = await CoupenDB.findOne({ code: { $regex: new RegExp(code, 'i') } });
        if (existCode) {
            req.flash('error', 'code already exist');
            return res.render('Admin/pages/addcoupen')
        } else {
            const coupen = new CoupenDB({
                couponName: coupenname,
                discountType: discounttype,
                minimumPurchaseAmount: minpurchase,
                discountAmountOrPercentage: discountamountorpercentage,
                code: code,
                description: description,
                expaireDate: enddate,
                startDate: startdate

            })
            await coupen.save()
            res.redirect('/admin/coupens')
        }
    }
    catch (error) {
        return res.redirect('/admin/500')
    }
}


// load edit coupen
const loadeditCoupen = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await CoupenDB.findById(id);
        res.render('Admin/pages/editcoupen', { data })
    }
    catch (error) {
        return res.redirect('/admin/500')
    }
}

const saveEditCoupen = async (req, res) => {
    try {
        const id = req.params.id;
        const { couponName, description, discountType, minimumPurchaseAmount, discountAmountOrPercentage, code, expaireDate, startDate } = req.body;
        const upadateCoupen = await CoupenDB.findById(id);

        if (code !== upadateCoupen.code) {
            const existCode = await CoupenDB.findOne({ code: { $regex: new RegExp(code, 'i') } });
            if (existCode) {
                console.log("exist code")
                return res.status(400).json({ success: false, message: 'Code already exists' });
            }
        }

        upadateCoupen.couponName = couponName;
        upadateCoupen.description = description;
        upadateCoupen.discountType = discountType;
        upadateCoupen.minimumPurchaseAmount = minimumPurchaseAmount;
        upadateCoupen.discountAmountOrPercentage = discountAmountOrPercentage;
        upadateCoupen.code = code;
        upadateCoupen.expaireDate = expaireDate;
        upadateCoupen.startDate = startDate;
        await upadateCoupen.save();
        return res.json({ success: true });
    } catch (error) {
        console.error(error);
        return res.redirect('/admin/500');
    }
};








// delete cuopen
const deleteCoupon = async (req, res) => {
    const { id } = req.params;
    try {
        const data = await CoupenDB.findByIdAndDelete({ _id: id })
        if (data) {
            return res.json({ success: true })
        } else {
            return res.json({ success: false })
        }
    } catch (e) {
        return res.json({ success: false })
        console.log(e)
    }
}


// load Dashboard
const loadDash = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfDay = today;
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        const deliveredOrdersSummary = await OrderDB.aggregate([
            {
                $match: {
                    deliverdAt: { $gte: startOfDay, $lt: endOfDay },
                    status: 'Delivered',
                },
            },
            {
                $group: {
                    _id: null,
                    totalDeliveredOrders: { $sum: 1 },
                    totalGrandTotal: { $sum: '$grandTotal' },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalDeliveredOrders: 1,
                    totalGrandTotal: 1,
                },
            },
        ]);


        const deliveredOrdersSummaryMonthly = await OrderDB.aggregate([
            {
                $match: {
                    deliverdAt: { $gte: startOfMonth, $lt: endOfMonth },
                    status: 'Delivered',
                },
            },
            {
                $group: {
                    _id: null,
                    totalGrandTotal: { $sum: '$grandTotal' },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalGrandTotal: 1,
                },
            },
        ]);

        const lastOrders = await OrderDB.find({})
            .sort({ orderDate: -1 })
            .limit(5)
            .populate('user')
            .populate('products.product')


        const productWithCount = await ProductDB.aggregate([
            {
                $group: {
                    _id: {
                        brand: "$brandname",
                        variant: "$varientname"
                    },
                    totalQuantity: { $sum: "$quantity" }
                }
            },
            {
                $sort: {
                    totalQuantity: 1
                }
            },
            {
                $limit: 5
            }
        ]);


        const totalUsers = await UserDB.countDocuments()
        res.render("Admin/pages/dashboard", { deliveredOrdersSummary, deliveredOrdersSummaryMonthly, totalUsers, lastOrders, productWithCount })
    } catch (error) {
        return res.redirect('/admin/500')
    }
}

// load line chart data
const getChartData = async (req, res) => {
    try {
        const orders = await OrderDB.find()

        const currentYear = new Date().getFullYear();

        const deliveredOrders = orders.filter(order => order.status === 'Delivered' && new Date(order.deliverdAt).getFullYear() === currentYear);

        const monthDeliveries = {};
        deliveredOrders.forEach(order => {
            const month = new Date(order.deliverdAt).getMonth();
            if (!monthDeliveries[month]) {
                monthDeliveries[month] = 1;
            } else {
                monthDeliveries[month]++;
            }
        });
        const cancelledOrders = orders.filter(order => order.status === 'Cancelled' && new Date(order.orderDate).getFullYear() === currentYear);
        let monthCancellations = {}
        cancelledOrders.forEach(order => {
            const month = new Date(order.orderDate).getMonth();
            if (!monthCancellations[month]) {
                monthCancellations[month] = 1;
            } else {
                monthCancellations[month]++;
            }
        })
        const returnedOrders = orders.filter(order => order.status === 'Return' && new Date(order.deliverdAt).getFullYear() === currentYear);
        let monthReturns = {};
        returnedOrders.forEach(order => {
            const month = new Date(order.deliverdAt).getMonth();
            if (!monthReturns[month]) {
                monthReturns[month] = 1;
            } else {
                monthReturns[month]++;
            }
        })
        const barData = {
            labels: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'july', 'aug', 'sep', 'oct', 'nov', 'dec'],
            datasets: [
                {
                    label: 'Delivered Orders',
                    data: [monthDeliveries[0], monthDeliveries[1], monthDeliveries[2], monthDeliveries[3], monthDeliveries[4]
                        , monthDeliveries[5], monthDeliveries[6], monthDeliveries[7], monthDeliveries[8], monthDeliveries[9], monthDeliveries[10], monthDeliveries[11]],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Cancelled Orders',
                    data: [monthCancellations[0], monthCancellations[1], monthCancellations[2], monthCancellations[3], monthCancellations[4]
                        , monthCancellations[5], monthCancellations[6], monthCancellations[7], monthCancellations[8], monthCancellations[9], monthCancellations[10], monthCancellations[11]],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Retuned Orders',
                    data: [monthReturns[0], monthReturns[1], monthReturns[2], monthReturns[3], monthReturns[4]
                        , monthReturns[5], monthReturns[6], monthReturns[7], monthReturns[8], monthReturns[9], monthReturns[10], monthReturns[11]],
                    backgroundColor: 'rgba(255, 205, 86, 0.2)',
                    borderColor: 'rgba(255, 205, 86, 1)',
                    borderWidth: 1,
                },
            ],
        };
        res.json(barData);
    } catch (error) {
        return res.redirect('/admin/500')
    }
}



// load sales report page
const loadsalesReport = async (req, res) => {
    try {
        res.render('Admin/pages/salesReport')
    } catch (error) {
        return res.redirect('/admin/500')
    }
}

// sales Report data
const salesReport = async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.body
        let salesData = await OrderDB.find({
            orderDate: { $gte: dateFrom, $lte: dateTo },
            status: 'Delivered'
        })
            .populate('products.product')
            .populate('user');
        const deliveredProducts = salesData.filter(order => order.status === 'Delivered');
        const deliveredGrandTotalSum = deliveredProducts.reduce((sum, order) => sum + order.grandTotal, 0);

        res.json({ salesData, deliveredGrandTotalSum })
    } catch (error) {
        console.log(error)
    }
}

// getPieChartData
const getPieChartData = async (req, res) => {
    try {
        const orders = await OrderDB.find()
        const totalOrders = orders.length;
        const deliveredOrders = orders.filter(order => order.status === 'Delivered').length;
        const cancelledOrders = orders.filter(order => order.status === 'Cancelled').length;
        const returnOrders = orders.filter(order => order.status === 'Return').length;

        const processingOrders = orders.filter(order => ['Pending', 'Processing', 'Shipped'].includes(order.status)).length;

        const deliveredPercentage = Math.floor((deliveredOrders / totalOrders) * 100);
        const cancelledPercentage = Math.floor((cancelledOrders / totalOrders) * 100);
        const processingPercentage = Math.floor((processingOrders / totalOrders) * 100);
        const returnPercentage = Math.floor((returnOrders / totalOrders) * 100);


        const pieData = {
            labels: ['Delivered', 'Cancelled', 'Return', 'Processing'],
            datasets: [
                {
                    data: [deliveredPercentage, cancelledPercentage, returnPercentage, processingPercentage],
                    backgroundColor: ['rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 205, 86, 0.8)', 'rgba(100, 110, 80, .5)'],
                },
            ],
        };
        res.json(pieData)
    } catch (error) {
        return res.redirect('/admin/500')
    }
}

// getYearChartData
const getYearChartData = async (req, res) => {
    try {
        const orders = await OrderDB.find();
        const deliveredOrders = orders.filter(order => order.status === 'Delivered');

        const yearSales = {};

        deliveredOrders.forEach(order => {
            const year = new Date(order.deliverdAt).getFullYear();
            if (!yearSales[year]) {
                yearSales[year] = 1;
            } else {
                yearSales[year]++;
            }
        });


        const cancelledOrders = orders.filter(order => order.status === 'Cancelled');
        const yearCancelled = {};

        cancelledOrders.forEach(order => {
            const year = new Date(order.orderDate).getFullYear();
            if (!yearCancelled[year]) {
                yearCancelled[year] = 1;
            } else {
                yearCancelled[year]++;
            }
        });

        const returnedOrders = orders.filter(order => order.status === 'Return');
        const yearReturned = {};

        returnedOrders.forEach(order => {
            const year = new Date(order.deliverdAt).getFullYear();
            if (!yearReturned[year]) {
                yearReturned[year] = 1;
            } else {
                yearReturned[year]++;
            }
        });



        const barData = {
            labels: [],
            datasets: [
                {
                    label: 'Delivered Orders',
                    data: [],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Cancelled Orders',
                    data: [],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Returned Orders',
                    data: [],
                    backgroundColor: 'rgba(255, 205, 86, 0.2)',
                    borderColor: 'rgba(255, 205, 86, 1)',
                    borderWidth: 1,
                },
            ],
        };

        Object.keys(yearSales).forEach(year => {
            barData.labels.push(year);
            barData.datasets[0].data.push(yearSales[year]);
        });

        Object.keys(yearCancelled).forEach(year => {
            barData.datasets[1].data.push(yearCancelled[year]);
        });

        Object.keys(yearReturned).forEach(year => {
            barData.datasets[2].data.push(yearReturned[year]);
        });

        res.json(barData)
    } catch (error) {
        return res.redirect('/admin/500')
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
    loadCoupens,
    addCoupon,
    deleteCoupon,
    loadaddCoupen,
    loadeditCoupen,
    saveEditCoupen,
    salesReport,
    loadsalesReport,
    getChartData,
    getPieChartData,
    getYearChartData


}