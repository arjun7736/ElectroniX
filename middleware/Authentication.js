const UserDB = require('../model/userModel')

// check user login
const isUserLoggedIn = async (req, res, next) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    next()
  }
}


// check admin logged in
const isAdminLoggedIn = async (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.render("Admin/pages/login")
  }
}



// logout 
const logout = (req, res, next) => {
  req.session.destroy()
  res.redirect('/login');
}



// authMiddleware.js
const checkUserSession = (req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
};

const isUserBlocked = async (req, res, next) => {
  try {
    if (!req.session.user) { res.redirect('/login') }
    const user = await UserDB.findById(req.session.user)
    if (user.isBlocked) {
      req.session.destroy()
      res.redirect('/blocked')
    } else {
      next()
    }
  } catch (error) {
    console.log('Error:', error);
  }
}




module.exports = {
  isAdminLoggedIn, logout, isUserLoggedIn, checkUserSession, isUserBlocked
}