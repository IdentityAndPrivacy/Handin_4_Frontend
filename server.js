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
var mongoose    = require('mongoose');
var passwordHash = require('password-hash');
var session = require('express-session');

app.use('/images', express.static(__dirname + "/images"));

// MONGO DB Setup and Seeddata
// MongoDB
var uristring =
process.env.MONGOLAB_URI ||
process.env.MONGOHQ_URL ||
'mongodb://localhost/HelloMongoose';

mongoose.connect(uristring, function (err, res) {
  if (err) {
  console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
  console.log ('Succeeded connected to: ' + uristring);
  }
});

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    keyHandle: String,
    publicKey: String,
    name:{
  		firstname: String,
  		lastname: String
  }
});

var PUser = mongoose.model('Users', userSchema);

//OUTCOMMEND TO PREVENT WIRED DELETION ERROR AT HEROKU!
// PUser.remove({}, function(err) {
//   if (err) {
//     console.log ('error deleting old data.');
//   }
// });

// var martin = new PUser ({
//   username: 'martin',
//   password: passwordHash.generate('123'),
//     keyHandle: '',
//   publicKey: '',
//   name:{
//   	firstname: 'Martin',
//   	lastname: 'Jensen'
//   }
// });
// martin.save(function (err) {if (err) console.log ('Error on save!')});


// var nikolas = new PUser ({
//   username: 'nikolas',
//   password: passwordHash.generate('111'),
//     keyHandle: '',
//   publicKey: '',
//   name:{
//   	firstname: 'Nikolas',
//   	lastname: 'Bram'
//   }
// });
// nikolas.save(function (err) {if (err) console.log ('Error on save!')});

// var gert = new PUser ({
//   username: 'gert',
//   password: passwordHash.generate('password'),
//     keyHandle: '',
//   publicKey: '',
//   name:{
//   	firstname: 'Gert',
//   	lastname: 'Mikkelsen'
//   }
// });
// gert.save(function (err) {if (err) console.log ('Error on save!')});

// var kasper = new PUser ({
//   username: 'kasper',
//   password: passwordHash.generate('112'),
//   keyHandle: '',
//   publicKey: '',
//   name:{
//   	firstname: 'Kasper',
//   	lastname: 'Nissen'
//   }
// });
// kasper.save(function (err) {if (err) console.log ('Error on save!')});


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Setup view engine
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var port = process.env.PORT || 8080;        // set our port

// Defining the App-ID
var appId = process.env.APPID || "https://localhost:8080";

// 1. Check if the user is logged in
//????????



// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.get('/', function(req, res) {
	res.render('home');
});

router.post('/login', function(req,res){
  var fUsername = req.body.username;
  var fPassword = req.body.password;
  var _res = res;

  var query = PUser.findOne({'username': fUsername});
  query.exec(function(err, user) {
    if (!err) {
      console.log(user);
      if(user !== null)
      {
        if(passwordHash.verify(fPassword, user.password))
          {
              _res.status(200);
              _res.json(
                { authenticated: true,
                  user: {
                    firstname: user.name.firstname,
                    lastname: user.name.lastname
                  }}
                );
          }
          else{
            _res.status(401);
            _res.json({ message: 'Wrong password' });
            _res.end();
          }
      }
      else{
        _res.status(401);
            _res.json({message: 'Something went wrong. Buhu!'});
            _res.end();
      }
    } else {
      _res.status(401);
        _res.json({message: 'Wrong username'});
        _res.end();
    }
  });
});


// 2. (On server) generate user registration request and save it in session:
router.get('/start_registration', function(req, res) {
  var fUsername = url.parse(req.url,true).query.username;

  var req = u2f.request(appId);
  session.authRequest = req;

  console.log('Session: ' + session.authRequest);
  console.log('GET: Start: ' + JSON.stringify(req));

  res.render('start_registration', {data: JSON.stringify(req),
                                    jsonData: req
  });
});


router.post('/finish_registration', function(req, res) {

  var fData = req.body.data;
  var username = req.body.username;
  console.log('POST: Received data: ' + fData);
  console.log('User: ' +username);

  // 4. (Server) Check registration result.
  var checkres = u2f.checkRegistration(session.authRequest, fData);
  console.log('Result checkRegistration: ' + checkres);

  if (checkres.successful) {
    // Registration successful, save 
    // checkres.keyHandle and checkres.publicKey to user's account in your db.
    var _res = res;

    var query = PUser.findOne({'username': username});
    query.exec(function(err, user) {
    if (!err) {
      console.log(user);
      if(user !== null)
      {
            user.publicKey = checkres.publicKey;
            user.keyHandle = checkres.keyHandle;
            user.save(function (err) {if (err) console.log ('Error on save!')});

            _res.status(200);
            _res.json({message: 'Device registered'});
            _res.end();
      }
      else{
        _res.status(421);
            _res.json({message: 'Something went wrong. Buhu!'});
            _res.end();
      }
    } else {
      _res.status(421);
        _res.json({message: 'Could not find username: ' + username});
        _res.end();
    }
  });

  } else {
    // checkres.errorMessage will contain error text.
        _res.status(421);
        _res.json({message: checkres.errorMessage});
        _res.end();
  }
  
});


router.get('/start_authentication', function(req, res) {
	var fUsername = url.parse(req.url,true).query.username;
	var query = PUser.findOne({'username': fUsername});
  	query.exec(function(err, user){
	    if (!err) {
			if(user !== null)
			{
				var req = u2f.request(appId, user.keyHandle);
				session.authRequest = req;

				res.render('start_authentication', {data: JSON.stringify(req)});

			}
		}
	});
	
});


router.post('/finish_authentication', function(req, res) {
	var fData = req.body.data;
  	var username = req.body.username;
  	console.log(fData);
  	console.log(username);

  	if(username !== null){

		var query = PUser.findOne({'username': username});
	  	query.exec(function(err, user) {
		    if (!err) {
				console.log(user);
				if(user !== null){
					var checkres = u2f.checkSignature(session.authRequest, fData, user.publicKey);

					if (checkres.successful) {
						// User is authenticated.
						console.log("User authenticated")
						res.json({message: 'User authenticated', publicKey: user.publicKey, fData: fData});
						res.end();

					} else {
						// checkres.errorMessage will contain error text.
						res.json( {message: checkres.errorMessage} );
						res.end();
					}
				}
			}
		});	
  	} else {
  		console.log("User not found!")
		res.json({message: 'User not found'});
		res.end();
  	}
});



app.use('', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);