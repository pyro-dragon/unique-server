// BASE SETUP
// =============================================================================

// Call the packages we need
var express	= require("express");				// Call express
var app	= express();							// Define our app using express
var bodyParser = require("body-parser");

// COUCHDB SETUP
// =============================================================================
var nano = require("nano")("http://dragonscancode.com:5984");

var db = nano.db.use("unique");
// =============================================================================

// Configure app to use bodyParser()
// This will let us get the data from a POST
app.use(bodyParser.urlencoded({limit: '50mb'}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var port = process.env.PORT || 8080;	// Set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();	// Get an instance of the express Router

// Middleware to use for all requests
router.use(function(request, response, next)
{
	// Do logging
	console.log("Something is happening.");
	console.log("Content-Type: " + request.headers["content-type"]);
	console.log(request.body);
	
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
		db.view("unique", "all", function(error, body)
		{
			response.json({ message: "listing all comics" });
		});
	})

	.post(function(request, response) 
	{
	    console.log("Got a create request");

		console.log("request: " + request.data);
	    var newComic = {
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
		
		console.log("Name: " + request.body.name);
		console.log("Comments: " + request.body.comments);
		console.log("Tags: " + request.body.tags);
		//console.log("Image: " + request.body.image);

		db.insert(newComic, function(error, body)
		{
			if(error)
			{
				response.json(error);
				return;
			}
			response.json({ message: "posted a new comic" });
		});
	});

router.route("/comics/latest")
	
	.get(function(request, response)
	{
		db.view("unique", "latest", {"descending": true, "limit": 1}, function(error, body)
		{
			if(error)
			{
				response.json(error);
				return;
			}

			response.json(body.rows[0].value);
		});
	});

router.route("/comics/:id")

	.get(function(request, response)
	{
		response.json({ message: "Getting an individual comic" });	
	})

	.post(function(request, response) 
	{
	    
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