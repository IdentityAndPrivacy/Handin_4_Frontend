// server.js

// BASE SETUP
// =============================================================================

	// Setup the packages that we need
var express    	= require('express');       // call express
var app        	= express();                 // define our app using express
var bodyParser 	= require('body-parser');
var url 	   	= require('url');
var u2f			= require('u2f');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.get('/', function(req, res) {
	res.send('Hello from server');
});

app.use('', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);