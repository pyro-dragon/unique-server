// BASE SETUP
// =============================================================================

// Call the packages we need
var express	= require("express");				// Call express
var app	= express();							// Define our app using express
var bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");
var config = require("./config.js");

// COUCHDB SETUP
// =============================================================================
var nano = require("nano")(config.databaseUrl);

var db = nano.db.use(config.database);
// =============================================================================

app.set("superSecret", config.secret);

// COMIC POSTING VARS
// =============================================================================
var latestComic = null;
var newComic = null;

// Configure app to use bodyParser()
// This will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");

    if(req.method == "OPTIONS")
    {
      res.sendStatus(200);
    }
    else {
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

router.route("/comic/latest")

	.get(function(request, response)
	{
	  console.log("getting latest");
		getLatest(

		// Success
		function(body)
		{
			response.json(latestComic);
		},

		// Fail
		function(error)
		{
			response.json(error);
		});
	});

// Get a given comic
router.route("/comic/:id").get(function(request, response)
{
	response.json({ message: "Getting an individual comic" });
});

// Authenticate the user and provide a token
router.route('/auth').post(function(request, response)
{
  // Check for username
  db.view("unique", "authenticate", { keys: [request.body.username] }, function(error, body)
	{
    //console.log(request);

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
      response.json({
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
  // Check header or url parameters or post parameters for token
  var token = request.body.token || request.query.token || request.headers['x-access-token'];

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
    "_id": request.body._id,
    "_rev": request.body._rev,
    "name": request.body.name,
    "image": request.body.image,
    "date-published": Math.floor(new Date() / 1000),
    "visible": true,
    "comments": request.body.comments,
    "chapter": "",
    "previouse": "",
    "next": null,
    "tags": request.body.tags
  };


  putComic(newComic, function()
  {
    response.json({
      success: true,
      message: 'Upload successful!'
    });
  },

  function(error)
  {
    response.json({
      success: false,
      message: error
    });
  });

  // Grab the latest comic
  /*getLatest(
    function()
    {
      linkNewComic();
    }, response.json());*/
});

// Utility Functions
// =============================================================================

/* Set up next/prev links for a new comic */
var linkNewComic = function(body)
{
	// We already have the latest comic
	console.log("latestComic._id: " + latestComic);
	newComic.previouse = latestComic._id;

	// Write out the new and latest comics
	console.log("Writing out the new comic");
	putComic(newComic,
		function(body)
		{
			latestComic.next = body.id;
			putComic(latestComic);
		}

	);
};

// Get the latest comic
// @args
// success - function to execute for a successful retrival
// fail - function to execute for a failure
var getLatest = function(success, fail)
{
	console.log("Preparing to GET latestComic. \nsuccess: " + success + "\nfail: " + fail);
	db.view("unique", "latest", {"descending": true, "limit": 1}, function(error, body)
	{
		if(error)
		{
			// Execute the optional function
			if(typeof fail == "function")
			{
				console.error(JSON.stringify(error));
				console.log("Executing fail function...");
				fail(error);

				return;
			}
		}
    else if(body.rows.length <= 0)
    {
				console.error("No values returned.");
				success(null);
    }
		else
		{
			latestComic = body.rows[0].value;
			console.log("Latest comic updated to be: " + latestComic.name);

			// Execute the optional function
			if(typeof success == "function")
			{
				console.log("Executing success function...");
				success(body.rows[0].value);
			}
		}
	});
};

// Put a new or updated comic into the database
// @Args
// comic - A comic object. No ID field = new comic
// success - A function to perform
var putComic = function(comic, success, fail)
{
	console.log("Preparing to PUT. \ncomic: " + comic + "\nsuccess: " + success + "\nfail: " + fail);
	db.insert(comic, function(error, body)
	{
		if(error)
		{
			console.error(JSON.stringify(error));

			if(typeof fail == "function")
			{
				console.log("Executing fail function...");
				fail(error);
			}

			return;
		}
		else
		{
			if (typeof success == "function")
			{
				console.log("Executing success function...");
				success(body);
			}
		}

		console.log("Successful upload!");
	});
};

// REGISTER OUR ROUTES -------------------------------
// All of our routes will be prefixed with /api
app.use('/', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
