// server.js

// BASE SETUP
// =============================================================================

// Setup the packages that we need
var express    	= require('express');
var exphbs 		= require('express-handlebars'); ;       // call express
var app        	= express();                 // define our app using express
var bodyParser 	= require('body-parser');
var url 	   	= require('url');
var https     = require('https');

app.use('/images', express.static(__dirname + "/images"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Setup view engine
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var port = process.env.PORT || 8080;        // set our port

// Defining the App-ID
var appId = process.env.APPID || "https://localhost:8080";


// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.get('/', function(req, res) {
	res.render('home');
});

router.post('/login', function(req,res){
  var username = req.body.username;
  var password = req.body.password;

  var reqUrl = "https://pi-host-server.herokuapp.com/session?up="+username+';'+password;
  console.log(reqUrl);
  
  https.get(reqUrl, function(response) {
    console.log("Got response: " + response.statusCode);
    if(response.statusCode === 200){
      var data = '';
      response.on('data', function(result){
          data += result;
      });
      response.on('end',function() {
        res.render('result', {response: JSON.parse(data)});
      });
      
    }
  });
   
});

app.use('', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);