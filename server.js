// BASE SETUP
// =============================================================================

// Call the packages we need
var express	= require("express");				// Call express
var app	= express();							// Define our app using express
var bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");
var config = require("./config.js");
var functions = require("./functions.js");

// COUCHDB SETUP
// =============================================================================
var nano = require("nano")(config.databaseUrl);

var db = nano.db.use(config.database);
// =============================================================================

app.set("superSecret", config.secret);

// Configure app to use bodyParser()
// This will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.json());

app.use(function(req, res, next)
{
	res.header("Access-Control-Allow-Origin", "*");
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");

    if(req.method == "OPTIONS")
    {
    	res.sendStatus(200);
    }
    else
	{
    	next();
    }
});

var port = process.env.PORT || 8080;	// Set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();	// Get an instance of the express Router

// Middleware to use for all requests
router.use(function(request, response, next)
{
	console.log("middleware1");

	// Do logging
	console.log("Content-Type: " + request.get("content-type"));
	console.log("Body: " + request.body);

	next();
});

// ROUTER
// =============================================================================

// Test route to make sure everything is working (accessed at GET http://localhost:8080)
router.get("/", function(request, response, next) {
	response.json({ message: "hooray! welcome to our api!"});
});

// More routes for our API will happen here

router.route("/comic")

	.get(function(request, response)
	{
		db.view("unique", "all", function(error, body)
		{
			response.json({ message: "listing all comics" });
		});
	});

// Fetch the latest comic from the server
router.route("/comic/latest").get(function(request, response)
{
	functions.getLatest(db,

		// Success
		function(body)
		{
			response.json(body);
		},

		// Fail
		function(error)
		{
			response.json(error);
		}
	);
});

// Fetch the first comic from the server
router.route("/comic/first").get(function(request, response)
{
	functions.getFirst(db,

		// Success
		function(body)
		{
			response.json(body);
		},

		// Fail
		function(error)
		{
			response.json(error);
		}
	);
});

// Get a given comic
router.route("/comic/:id").get(function(request, response)
{
	functions.getComic(db, request.params.id,

		// Success
		function(body)
		{
			response.json(body);
		},

		// Fail
		function(error)
		{
			response(json.error);
		}
	);
});

// Authenticate the user and provide a token
router.route('/auth').post(function(request, response)
{
  // Check for username
  db.view("unique", "authenticate", { keys: [request.body.username] }, function(error, body)
	{
	    // Now check their password
	    if(request.body.password == body.rows[0].value)
	    {
	        // Matching password too, create a token
	      var token = jwt.sign(body.rows[0], app.get('superSecret'), {
	        "expiresIn": 86400 // expires in 24 hours
	      });

	      console.log("User " + request.body.username + " logged in.");

	      response.json(token);
	    }
	    else
	    {
		    console.log("Username or password not found");
		    response.json(
			{
		        success: false,
		        message: 'Wrong username or password'
		    });
	    }
	});
});

// JWT SECURITY
// =============================================================================
router.use(function(request, response, next)
{
	console.log("getting token");
	// Check header or url parameters or post parameters for token
	var token = request.body.token || request.query.token || request.headers['x-access-token'];
	console.log("got token");

	// decode token
	if (token)
	{
		// Verifies secret and checks exp
	    jwt.verify(token, app.get('superSecret'), function(error, decoded)
	    {
		    if (error)
		    {
		        return response.json(
			    {
			        success: false,
			        message: 'Failed to authenticate token.'
			    });
		    }
		    else
		    {
		        // If everything is good, save to request for use in other routes
		        request.decoded = decoded;
		        next();
		    }
	    });
	}
	else
	{
	    // If there is no token
	    // Return an error
	    return response.status(403).send(
		{
	        success: false,
	        message: 'No token provided.'
	    });
	}
});

/*------------------------------------*/
// Post a new comic or update a comic //
/*------------------------------------*/
router.route("/comic").post(function(request, response)
{
  // Build the new comic data structure
	console.log("building comic");
	newComic = {
	    "name": request.body.name,
	    "image": request.body.image,
	    "date-published": Math.floor(new Date() / 1000),
	    "visible": true,
	    "comments": request.body.comments,
	    "chapter": "",
	    "previous": "",
	    "next": null,
	    "tags": request.body.tags
	};


	console.log("Sending this: " + JSON.stringify(newComic));

	functions.putComic(db, newComic,

		// Success
		function()
		{
			response.json(
			{
			    success: true,
			    message: 'Upload successful!'
		    });
		},

		// Fail
		function(error)
		{
		    response.json(
			{
				success: false,
				message: error
		    });
		}
	);
});

/*---------------------*/
// Delete a comic page //
/*---------------------*/
router.route("/comic/:id/:rev").delete(function(request, response)
{
	console.log("Deleting comic");

	functions.deleteComic(db, request.params.id, request.params.rev,

		// Success
		function()
		{
			response.json(
			{
			    success: true,
			    message: 'Delete successful!'
		    });
		},

		// Fail
		function(error)
		{
		    response.json(
			{
				success: false,
				message: error
		    });
		}
	);
});

// REGISTER OUR ROUTES -------------------------------
// All of our routes will be prefixed with /api
app.use('/', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
