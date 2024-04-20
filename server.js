//import all dependencies
const express = require('express'),
      mongoose = require('mongoose'),
      bodyParser = require('body-parser'),
      session = require("express-session"),
	  bcrypt = require('bcrypt');

const app = express();
const path = require('path');
const port = 3000;
const User = require("./model/user");
const { register } = require('module');

//connect to mongodb server (edit if necessary)
mongoose.connect("mongodb://localhost:27017/finder"); //this is the default local server link-auto creates finder db

//set ejs as view
app.set("view engine", "ejs");
//use body parser for easy return of elements
app.use(bodyParser.urlencoded({ extended: true }));
//express session
app.use(session({
	secret: "Rusty is a dog", //unique string
	resave: false,
	saveUninitialized: false
}));


// Serve static files from the current directory
app.use(express.static(__dirname));

//=====================
// ROUTES
//=====================

// Showing home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
  //res.render("index");
});

// Showing register form
app.get("/register", function (req, res) {
	res.render("register");
});

//Showing login form
app.get("/login", function (req, res) {
	res.redirect("/");
});

// Handling user signup
app.post("/register", async (req, res) => {
    try {
        // Check if the username already exists
        const existingUser = await User.findOne({ username: req.body.username });
        if (existingUser) {
            res.render("registererr", {errmsg: "User already exists"});
			return;
        } else {
			//hash the password with 12 salts
			var hashpwd = await bcrypt.hash(req.body.password, 12);
			// If username is unique, create a new user
			const user = await User.create({
				nickname: req.body.nickname,
				username: req.body.username,
				password: hashpwd
			});
		
			res.redirect('/');
		}
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Handling user login
app.post("/login", async function(req, res){
	try {
		// check if the user exists
		const user = await User.findOne({ username: req.body.username });
		if (user) {
		//check if password matches
		const result = await bcrypt.compare(req.body.password, user.password);
		if (result) {
			res.render("secret", {uname: `hello, ${user.nickname}`});
		} else {
			res.render("index", { errmsg: "Wrong password" });
		}
		} else {
			res.render("index", { errmsg: "Username doesnt exist!" });
		}
	} catch (error) {
		res.status(400).send({ error });
	}
});

//Handling user logout 
app.get("/logout", function (req, res) {
	req.logout(function(err) {
		if (err) { return next(err); }
		res.redirect('/');
	});
});

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) return next();
	res.redirect("/login");
}

app.listen(port, () => {
  console.log(`Running on port http://localhost:${port}`);
});
