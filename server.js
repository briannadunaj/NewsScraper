var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var logger = require("morgan");

var Article = require("./models/News.js");
var Comment = require("./models/Comments.js");

mongoose.Promise = Promise;

var app = express();


app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(express.static("public"));

var PORT = process.env.PORT || 3000;

// database configuration with mongoose

var db = process.env.MONGODB_URI || "mongodb://localhost/NewsScraper";

mongoose.connect(db, function(error){
  if (error){
    throw error;

  } else {
    console.log("Connected to mongoose");
  }
})


// routes
app.get("/scrape", function(req, res) {
	console.log("scrape");
  request("https://www.reddit.com/r/space/", function(error, response, html) {
    var $ = cheerio.load(html);
    
    $("p.title").each(function(i, element) {

      var result = {};

      result.title = $(this).text();
      result.link = $(this).children().attr("href");

			var entry = new Article(result);

			entry.save(function(err, doc){
				if (err) {
					console.log(err);
				} else {
					console.log(doc);
				}
			}); // end of entry.save
		}); // end of each function
	}); // end of request

	res.send("Scrape Complete");
}); // end of app.get /scrape


app.get("/articles", function(req, res) {

  Article.find({})
    .populate("comment")
    .exec(function(error, doc) {
 
    if (error) {
      console.log(error);
    } else {
      res.json(doc);
    }
  }); // end of .exec
}); // end of get articles

app.get("/articles/:id", function(req, res) {

  Article.findOne({ "_id": req.params.id })
  .populate("comment")
  .exec(function(error, doc) {
    if (error) {
      console.log(error);
    } else {
      res.json(doc);
    }
  }); // end of .exec
}); // end of get articles/:id

app.post("/articles/:id", function(req, res) {

  var newComment = new Comment(req.body);

  newComment.save(function(error, doc) {
    if (error) {
      console.log(error);
    } else {
      Article.findOneAndUpdate({ "_id": req.params.id }, { "comment": doc._id })
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          res.send(doc);
        }
      }); // end of .exec
    }
  }); // end of new note save
}); // end of post articles/:id



app.listen(PORT, function(){
	console.log("App running on port", PORT);
});