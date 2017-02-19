

// Get the latest comic
// @args
// db - database connection
// success - function to execute for a successful retrival
// fail - function to execute for a failure
var getLatest = function(db, success, fail)
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
			console.log("Latest comic updated to be: " + body.rows[0].value.name);

			// Execute the optional function
			if(typeof success == "function")
			{
				console.log("Executing success function...");
				success(body.rows[0].value);
			}
		}
	});
};

// Get the first comic
// @args
// success - function to execute for a successful retrival
// fail - function to execute for a failure
var getFirst = function(db, success, fail)
{
	console.log("Preparing to GET firstComic. \nsuccess: " + success + "\nfail: " + fail);
	db.view("unique", "latest", {"ascending": true, "limit": 1}, function(error, body)
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
			console.log("First comic updated to be: " + body.rows[0].value.name);

			// Execute the optional function
			if(typeof success == "function")
			{
				console.log("Executing success function...");
				success(body.rows[0].value);
			}
		}
	});
};

// Get a specific comic page
// @args
// comicID - string - Used to identify a comic page to pull from the server
// success - function to execute for a successful retrival
// fail - function to execute for a failure
var getComic = function(db, comicID, success, fail)
{
	console.log("Preparing to GET comic. \ncomicID: " + comicID + " \nsuccess: " + success + "\nfail: " + fail);
	db.get(comicID, function(error, body)
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
		else
		{
			console.log("We fetched the comic called: " + body.name);

			// Execute the optional function
			if(typeof success == "function")
			{
				console.log("Executing success function...");
				success(body);
			}
		}
	});
};

// Put a new or updated comic into the database
// @Args
// comic - A comic object. No ID field = new comic
// success - A function to perform
var putComic = function(db, comic, success, fail)
{
	// Get the ID of the current latest comic before uploading anything
	getLatest(db, function(currentLatestComic)
	{
		// Link this to the new comic
		if(currentLatestComic !== null)
		{
			comic.previous = currentLatestComic._id;
		}

		// Upload the comic
		console.log("Preparing to PUT. \ncomic: " + comic + "\nsuccess: " + success + "\nfail: " + fail);
		db.insert(comic, function(error, responseBody)
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
				// Set the old latest comic to link to the new one
				currentLatestComic.next = responseBody.id;

				// Commit this updated
				db.insert(currentLatestComic, function(error, updateResponse)
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
					else if (typeof success == "function")
					{
						console.log("Executing success function...");
						success(updateResponse);
					}
				});
			}

			console.log("Successful upload!");
		});
	});
};
module.exports = {
    "getLatest": getLatest,
    "getFirst": getFirst,
    "getComic": getComic,
    "putComic": putComic
};
