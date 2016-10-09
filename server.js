// BASE SETUP
// =============================================================================

// Call the packages we need
var express	= require("express");				// Call express
var app	= express();							// Define our app using express
var bodyParser = require("body-parser");

// Configure app to use bodyParser()
// This will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;	// Set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();	// Get an instance of the express Router

// Middleware to use for all requests
router.use(function(request, response, next)
{
	// Do logging
	console.log("Something is happening.");
	
	next();
});

// Test route to make sure everything is working (accessed at GET http://localhost:8080)
router.get("/", function(request, response) {
	response.json({ message: "hooray! welcome to our api!"});	 
});

// More routes for our API will happen here

router.route("/comics")

	.get(function(request, response)
	{
		response.json({ message: "listing all comics" });	
	})

	// Create a bear (accessed at POST http://localhost:8080/api/bears)
	.post(function(request, response) 
	{
	    
	    /*var bear = new Bear();		// Create a new instance of the Bear model
	    bear.name = request.body.name;	// Set the bears name (comes from the request)

	    // save the bear and check for errors
	    bear.save(function(err) {
	        if (err)
	            response.send(err);

	        response.json({ message: 'Bear created!' });
	    });*/

		response.json({ message: "posted a new comic" });	
	});

router.route("/comics/latest")
	
	.get(function(request, response)
	{
		response.json({ message: "Getting the latest commic" });	
	});

router.route("/comics/:id")

	.get(function(request, response)
	{
		response.json({ message: "Getting an individual comic" });	
	})

	// Create a bear (accessed at POST http://localhost:8080/api/bears)
	.post(function(request, response) 
	{
	    
	    /*var bear = new Bear();		// Create a new instance of the Bear model
	    bear.name = request.body.name;	// Set the bears name (comes from the request)

	    // save the bear and check for errors
	    bear.save(function(err) {
	        if (err)
	            response.send(err);

	        response.json({ message: 'Bear created!' });
	    });*/

		response.json({ message: "Updating a comic" });	
	})

	.delete(function(request, response)
	{
		response.json({ message: "Deleting a comic" });	
	});

router.route("/login")
	
	.post(function(request, response)
	{
		response.json({ message: "Logging the user in" });	
	});

router.route("/logout")
	
	.post(function(request, response)
	{
		response.json({ message: "Logging the user out" });	
	});

// REGISTER OUR ROUTES -------------------------------
// All of our routes will be prefixed with /api
app.use('/', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);