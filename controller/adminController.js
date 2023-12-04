const bcrypt = require('bcrypt');
const { render } = require('ejs');
const session = require("express-session")
const UserDB = require('../model/userModel')
const AdminDB = require('../model/adminModel')
const ProductDB = require('../model/productModel')
const BrandDB = require('../model/brandModel')
const CategoryDB = require('../model/categoryModel')
const SubCategoryDB = require('../model/subcategoryModel')
const crypto = require('crypto');
require('dotenv').config();
const multer = require('multer');
const upload = multer();









// admin it is admin or not

const adminCheck = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await AdminDB.findOne({ email });

        if (!admin) {
            console.error("User not found");
            return res.redirect("/admin/login");
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (isMatch) {
            req.session.admin = email;
            return res.redirect("/admin/dashboard");
        } else {
            return res.redirect("/admin/login");
        }
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).send("Internal Server Error");
    }
};


// load login
const loadLogin = (req, res) => {
    res.render("Admin/pages/login")
}



// load userlist
const loadUser = async (req, res) => {
    try {
        const userList = await UserDB.find();
        res.render('Admin/pages/userlist', { userList });
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
    try {
        const productList = await ProductDB.find();
        res.render('Admin/pages/products', { productList });
    } catch (error) {
        console.error("Error fetching user list:", error);
        res.status(500).send('Internal Server Error');
    }
}


// load banner
const loadBanner = (req, res) => {
    res.render("Admin/pages/banner")
}

// load category
const loadCategory = async (req, res) => {
    try {
        const categoryList = await CategoryDB.find()
        const brandList = await BrandDB.find()
        const subcategoryList = await SubCategoryDB.find()
        res.render('Admin/pages/category', { brandList, categoryList, subcategoryList })
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
    const { images, brandname, category, subcategory, varientname, price, quantity, description } = req.body;

    const { productid } = req.params
    console.log(productid)
    try {
        const updatedProduct = await ProductDB.findOneAndUpdate(
            { _id: productid },
            {
                brandname: brandname,
                category: category,
                subcategory: subcategory,
                varientname: varientname,
                price: price,
                quantity: quantity,
                description: description,
            },
            { new: true }
        );
        req.files.forEach(file => {
            updatedProduct.images.push({
                data: file.buffer,
                contentType: file.mimetype,
            })
        })


    } catch (error) {
        console.log(error.message)
    }
}



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

        const productList = await ProductDB.find();
        return res.render('Admin/pages/products', { productList });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
};









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
    const { images, brandname, category, subcategory, varientname, price, quantity, description } = req.body;
    try {

        // const varient = ProductDB.find({ varientname })
        // if (varient) {
        //     return res.status(500).json({ message: "Varient already exists" });
        // }
        // else{
        const product = new ProductDB({
            brandname,
            category,
            subcategory,
            varientname,
            price,
            quantity,
            description
        });

        req.files.forEach(file => {
            product.images.push({
                data: file.buffer,
                contentType: file.mimetype,
            })
        })

        const newproduct = await product.save();

        // }

        // Handle successful save
        if (newproduct) {
            return res.redirect('/admin/products');
        } else {
            console.log("Error: Product not saved");
            return res.status(500).json({ error: "Internal Server Error" });
        }
    } catch (error) {
        console.log("Error Occurred:", error.message);
        return res.status(500).json({ error: "catch Server Error" });
    }
};



// add brands
const addBrands = async (req, res) => {
    const { brandname } = req.body
    try {
        const brand = await BrandDB.findOne({ brandname })
        if (!brand) {
            const Brand = new BrandDB({
                brandname
            })
            const newBrand = await Brand.save()
            if (newBrand) {
                return res.redirect('/admin/category')
            }
        } else {
            return res.send(`${brandname} already exists`)
        }
    } catch {
        console.log("Error Occured")
    }
}



// add category
const addCategory = async (req, res) => {
    const { categoryname } = req.body
    try {
        const category = await CategoryDB.findOne({ categoryname })
        if (!category) {
            const Category = new CategoryDB({
                categoryname
            })
            const newCategory = await Category.save()
            if (newCategory) {
                return res.redirect('/admin/category')
            }
        } else {
            return res.send(`${categoryname} already exists`)
        }
    } catch {
        console.log("Error Occured")
    }
}


// add sub category
const addSubCategory = async (req, res) => {
    const { subcategoryname } = req.body
    try {
        const subcategory = await SubCategoryDB.findOne({ subcategoryname })
        if (!subcategory) {
            const SubCategory = new SubCategoryDB({
                subcategoryname
            })
            const newCategory = await SubCategory.save()
            if (newCategory) {
                return res.redirect('/admin/category')
            }
        } else {
            return res.send(`${subcategoryname} already exists`)
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
}