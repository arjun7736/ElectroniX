const session = require('express-session')
const mongoose = require("mongoose")
require('dotenv').config();
const nocache = require('nocache')
const express = require('express')
const app = express();
const morgan = require('morgan');
const uuid = require('uuid');
const sharp =require('sharp')
const { v4: uuidv4 } = require("uuid");
const path = require('path');
const userRoute = require('./routes/userRoutes')
const adminRoute = require('./routes/adminRoutes')
const cors = require('cors');
const flash = require('express-flash');
const {checkUserSession}=require('./middleware/Authentication')






app.use(cors());
app.use(express.json())
app.use(express.static('public'));
app.use(morgan('tiny')) 
app.set('view engine', 'ejs')
app.use(nocache())
app.use(express.urlencoded({ extended: true }))
app.use(session({
    secret: uuid.v4(),
    resave: false,
    saveUninitialized: false,
}))
app.use(checkUserSession)
app.use(flash());
app.use('/',userRoute)
app.use('/admin',adminRoute)
app.all("/*",(req,res)=>res.render("404"))















mongoose
    .connect(process.env.MONGO)
    .then(() => console.log('DataBase Connected'))
    .catch(err => console.log(err))

app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`)
})
