// 2. Load required items here.
const bodyParser = require('body-parser');
const express = require('express');
const ejs = require('ejs');
const passport = require('passport');
const LdapStrategy = require('passport-ldapauth');
const config = require('./config');

// 3. Initilize the Express app here.
const app = express();

// Define user serialization and deserialization. You don't need to do anything here.
passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(user, done) {
	done(null, user);
});

/*
 4. Use and configure LDAP Auth here. 
 Include these 5 options: url, bindDn, bindCredentials, searchBase, searchFilter. 
 The first 4 are defined in the config.js, so you should reference those config options. 
 'searchFilter' should have a value that tells it to filter by 'sAMAccountName'. 
 Add a new option with that value to the config.js and reference it here.
*/
passport.use(new LdapStrategy({
	ldap: {
		url: config.ldap.url,
		bindDN: config.ldap.bindDN,
		bindCredentials: config.ldap.bindCredentials,
		searchBase: config.ldap.searchBase,
		searchFilter: config.ldap.searchFilter,
	}
}));

// Configure view engine to render EJS templates. You don't need to do anything here.
app.set("views", __dirname + "\\views");
app.set("view engine", "ejs");
// The commented version below worked when I tested for the / instead of \
//app.set("views", __dirname + "/views");

// 5. Configure app level middleware. 
// You just need to tell the app to use Passport (with sessions enabled) at the bottom of this block.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(require("express-session")({ secret: "keyboard cat", resave: true, saveUninitialized: true}));
app.engine('html', require('ejs').renderFile);
app.use(passport.initialize(), passport.session());

// 6. Define GET "/" method here.
app.get('/', (req, res, next) => {
	try {
		res.render('home.html');
		next();
	} catch (error) {
		return res.status(400).json({ error: error.toString() });
	}
});

// 7. Define POST "/login" method here.
app.post('/login',
  passport.authenticate('ldapauth', 
  { successRedirect: '/profile', failureRedirect: '/login', failureFlash: 'Invalid username or password.' }), function(req, res, next) {
	  try {
		res.send({status: 'ok'});
	  	next();
	  } catch (error) {
		  return res.status(400).json({ error: error.toString() });
	  }
});

// 8. Define GET "/profile" method here.
app.get('/profile', (req, res, next) => {
	try {
		res.render('home.html', {user: req.user});
		next();	
	} catch (error) {
		return res.status(400).json({ error: error.toString() });
	}
});

// Tell app to listen on post 8081. You don't need to do anything here.
const port = 8081;
app.listen(port, function() {
	console.log(`listening on ${port}`);
});


/*
Tests to run for validating functionality:
1.) Test each endpoint to verify full flow from request at '/' page to '/profile' page. 
These would include unit tests with asserts and an integration test, along with verifying all user info is presented correctly.
2.) Test for how protected each endpoint is via accessing directly each endpoint url.
Tests would require using common vulnerabilities that are present on passport
3.) Test for various credentials and ensure tokens are valid for the correct authorization levels
4.) Test for access granted/denied for various scenarios. 
These include: no username, incorrect username and password, no password, incorrect password
5.) Do end-to-end testing for admin level, regular user level (if this site has different permissions expected)
*/