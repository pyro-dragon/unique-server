var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require("fs");

// Configure the app to use bodyParser()
// This lets us get data from a POST request
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Set the application port
var port = process.env.PORT || 8080;

// Routes for the API

var router = express.Router();   // The express router

// Test to make sure everything is working
router.get("/", function(request, response)
{
   request.json({
      message: "Horray! Welcome to our API"
   });
});

// Start the server
app.listen(port);
console.log("Magic happens on port " + port);

// Register the routes
// All of the routes will be prefixed with /api
/*app.use("/api", router);

// GET list of all users
app.get('/listUsers', function (req, res)
{
	fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data)
	{
		console.log( data );
		res.end( data );
	});
});

var user = {
   "user4" : {
      "name" : "mohit",
      "password" : "password4",
      "profession" : "teacher",
      "id": 4
   }
};

// PUT in a new user
app.get('/addUser', function (req, res) {
   // First read existing users.
   fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
      data = JSON.parse( data );
      data["user4"] = user["user4"];
      console.log( data );
      res.end( JSON.stringify(data));
   });
});

// GET details of one user
app.get('/:id', function (req, res) {
	 // First read existing users.
	 fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
			data = JSON.parse( data );
			var user = data["user" + req.params.id] 
			console.log( user );
			res.end( JSON.stringify(user));
	 });
});

// DELETE a user
app.get('/deleteUser/:id', function (req, res) {
   // First read existing users.
   fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
      data = JSON.parse( data );
      delete data["user" + req.params.is];
       
      console.log( data );
      res.end( JSON.stringify(data));
   });
})

var server = app.listen(8081, function ()
{
	var host = server.address().address;
	var port = server.address().port;

	console.log("Example app listening at http://%s:%s", host, port)
});*/