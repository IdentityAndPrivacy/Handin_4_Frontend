// server.js

// BASE SETUP
// =============================================================================

// Setup the packages that we need
var express    	= require('express');
var exphbs 		= require('express-handlebars'); ;       // call express
var app        	= express();                 // define our app using express
var bodyParser 	= require('body-parser');
var url 	   	= require('url');
var u2f			= require('u2f');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Setup view engine
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var port = process.env.PORT || 8080;        // set our port

// Defining the App-ID
var appId = "https:localhost:8080";

// 1. Check if the user is logged in
//????????



// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.get('/', function(req, res) {
	res.render('home');
});


// 2. (On server) generate user registration request and save it in session:
router.get('/start_registration', function(req, res) {
	var req = u2f.request(appId);
	session.authRequest = req;
});


router.post('/finish_registration', function(req, res) {
	var checkres = u2f.checkRegistration(session.authRequest, res);

	if (checkres.successful) {
    	// Registration successful, save 
    	// checkres.keyHandle and checkres.publicKey to user's account in your db.
	} else {
	    // checkres.errorMessage will contain error text.
	}
});


router.get('/start_authentication', function(req, res) {
	var req = u2f.request(appId, user.keyHandle);
	session.authRequest = req;
});

router.post('/finish_authentication', function(req, res) {
	var checkres = u2f.checkSignature(session.authRequest, res, user.publicKey);

	if (checkres.successful) {
		// User is authenticated.
	} else {
		// checkres.errorMessage will contain error text.
	}
});



app.use('', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);