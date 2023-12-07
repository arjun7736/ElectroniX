// check user login
const isUserLoggedIn = async (req, res, next) => {
  if (req.session.user) {
    res.render('User/pages/landing')
  } else if (req.session.admin) {
    res.redirect('/admin/dashboard');
  } else {
    next()
  }
}


// check admin logged in
const isAdminLoggedIn = async (req, res, next) => {
  if (req.session.admin) {
    next();
  } else if (req.session.user) {
    res.redirect('/');
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
const  checkUserSession = (req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
};






module.exports = {
  isAdminLoggedIn, logout, isUserLoggedIn,checkUserSession
}