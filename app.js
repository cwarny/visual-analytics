var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var TweetProvider = require('./tweetprovider').TweetProvider;

var app = express();

app.configure(function() {
    app.set('port', process.env.PORT || 8080);
    app.set('views', __dirname + '/views');
    //app.engine('.html',require('jade').__express);
    //app.engine('html',engines.mustache);
    app.set('view engine', 'jade');
    app.set('view options', {layout:false});
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(require('stylus').middleware(__dirname + '/public'));
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

var tweetProvider = new TweetProvider('localhost', 27017);

//Routes

app.get('/', function(req,res) {
    res.render('index2');
});

app.get('/getTweets', function(req,res) {
    tweetProvider.findAll(function(error,t) {
      res.json(t);
    });
});

app.get('/tweets/fetch', function(req, res) {
    res.render('tweets_fetch', {
	title: 'Fetched tweets'
    });
});

app.post('/tweets/fetch', function(req, res) {

    var tsession = require("temboo/core/temboosession");
    var session = new tsession.TembooSession("cewarn", "myFirstApp", "9e3df035-e535-48d5-8");

    var Twitter = require("temboo/Library/Twitter/Search");

    var tweetsChoreo = new Twitter.Tweets(session);

    //Instantiate and populate the input set for the choreo
    var tweetsInputs = tweetsChoreo.newInputSet();

    //Set credential to use for execution
    tweetsInputs.setCredential('twitter');

    //Set inputs
    tweetsInputs.set_Query(req.param('q'));
    
    //Run the choreo, specifying success and error callback handlers  
    tweetsChoreo.execute(
	tweetsInputs,
	function(results){
            var r = JSON.parse(results.get_Response()).statuses;
	    tweetProvider.save(r, function(error,docs) {
		res.redirect('/')
	    });
	},
	function(error){
            console.log(error.type); console.log(error.message);
        }
    );
});    

app.listen(8080, function(){console.log("Express server listening on port " + app.get('port'))});
