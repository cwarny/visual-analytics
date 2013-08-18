var MongoClient = require('mongodb').MongoClient;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

TweetProvider = function(host, port) {
    var mongoClient = new MongoClient(new Server(host, port));
    mongoClient.open(function(){});
    this.db = mongoClient.db("tweets");
};

TweetProvider.prototype.getCollection = function(callback) {
    this.db.collection('tweets', function(error, tweet_collection) {
	if(error) callback(error);
	else callback(null, tweet_collection);
    });
};

TweetProvider.prototype.findAll = function(callback) {
    this.getCollection(function(error, tweet_collection) {
	if(error) callback(error)
	else {
	    tweet_collection.find({"place.country_code":"US"}).toArray(function(error, results) {
		if(error) callback(error)
		else callback(null, results)
	    });
	}
    });
};

TweetProvider.prototype.save = function(tweets, callback) {
    this.getCollection(function(error, tweet_collection) {
	if(error) callback(error);
	else {
	    if (typeof(tweets.length)=="undefined") tweets = [tweets];
	    tweet_collection.insert(tweets, function() {
		callback(null, tweets);
	    });
	}
    });
};

exports.TweetProvider = TweetProvider;
