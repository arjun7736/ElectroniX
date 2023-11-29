const bcrypt = require('bcrypt');
const { render } = require('ejs');
const session = require("express-session")
const UserDB = require('../model/userModel')
const AdminDB = require('../model/adminModel')
const ProductDB = require('../model/productModel')
const BrandDB = require('../model/brandModel')
const CategoryDB = require('../model/categoryModel')
const SubCategoryDB = require('../model/subcategoryModel')
const nodemailer = require('nodemailer');
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
        const subcategoryList =await SubCategoryDB.find()
        res.render('Admin/pages/category', { brandList, categoryList,subcategoryList })
    } catch (error) {
        console.error("Error fetching user list:", error);
        res.status(500).send('Internal Server Error');
    }
}


// add product
const loadAddproducts = async (req, res) => {
    try {
        const brand = await BrandDB.find()
        const category =await CategoryDB.find()
        const subcategory =await SubCategoryDB.find()
        res.render('Admin/pages/addproducts',{brand,category,subcategory})
    }
    catch(error) {
        console.error("Error fetching user list:", error);
        res.status(500).send('Internal Server Error');
    }

}








// sent otp
const sendOTP = async (email) => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL,
            pass: process.env.PASS
        }
    });

    const mailOptions = {
        from: process.env.MAIL, // Replace with your Gmail email address
        to: email,
        subject: 'OTP Verification',
        text: `Your OTP is: ${otp}. Use this OTP to verify your account.`
    };

    try {

        await transporter.sendMail(mailOptions);
        console.log('OTP sent successfully.');
        return otp; // Return the generated OTP for verification
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw error;
    }
};





// Function to register the user and send OTP
const registerAndSendOTP = async () => {
    // Implement your user registration logic here

    // For demonstration purposes, let's assume a successful registration
    const registrationSuccessful = true;

    if (registrationSuccessful) {
        try {
            // Get the user's email from the form
            const email = document.getElementById('userEmail').value; // Replace with the actual ID of your email input field

            // Make an API call to your server to send the OTP
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                alert('Registration successful. OTP sent!');
                // Redirect or perform further actions as needed
            } else {
                alert('Failed to send OTP. Please try again.');
                // Handle the error appropriately
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
            // Handle the error appropriately
        }
    } else {
        alert('Registration failed. Please check your details and try again.');
        // Handle the registration failure appropriately
    }
}






// compare otp
function verifyOTP() {
    const enteredOTP = document.getElementById('first').value +
        document.getElementById('second').value +
        document.getElementById('third').value +
        document.getElementById('fourth').value;
    const receivedOTP = '1234'; // Replace with the actual received OTP

    if (enteredOTP === receivedOTP) {
        alert('OTP is correct. Verification successful!');
    } else {
        alert('Incorrect OTP. Please try again.');
    }
}



// save products
const addProduct = async (req, res) => {
    const { images, brandname, category ,subcategory, varientname, price, quantity, description } = req.body;
    try {

        // const varient = ProductDB.find({ varientname })
        console.log(req.body)
        // if (varient) {
        //     return res.status(500).json({ message: "Varient already exists" });
        // }
        // else{
            const product = new ProductDB({
                images,
                brandname,
                category,
                subcategory,
                varientname,
                price,
                quantity,
                description
            });
    
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
    sendOTP,
    addProduct,
    toggleBlockUser,
    loadProducts,
    loadBanner,
    loadCategory,
    loadAddproducts,
    addBrands,
    addCategory,
    addSubCategory
}