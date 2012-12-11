var express = require('express');
var mongo = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
//var DBRef = require('mongodb').DBRef;
var app = express()
	,server = require('http').createServer(app);
var  config = require('./config');


var db = new mongo.Db(
	config.DB_NAME || 'drawing', 
	new  mongo.Server(
		config.DB_HOST || 'localhost', 
		config.DB_PORT || 27017, 
		{ auto_reconnect: true }
	), 
	{ safe : true}
);

var gameData = require('./lib/gameData')(db);

//app.engine('.html', require('ejs').__express);
//app.set('views', __dirname + '/views');
//app.set('view engine', 'html');
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'));
app.use(app.router);

var io = require('socket.io').listen(server);
io.set('log level', 1); 
io.sockets.on('connection', function(socket) {
	socket.on('draw', function(data) {
			    socket.broadcast.emit('draw', data);
	});
});



app.post('/data/setupGame', function(req, res) {
	var result = new ObjectID();
	res.send(result);
});

app.post('/data/game/:id/join', function(req, res, next) {
	console.log(req.body);
	if (!req.params.id || !req.body.playerName) {
		return res.send(400);
	}

	gameData.joinGame(req.params.id, req.body.playerName, function(err, identifier) {
		if (err) return next(err);
		res.send(identifier);
	});
});


app.post('/data/game/:game/start', function(req, res, next) {
	if (!req.params.game) return res.send(400);
	gameData.createTurn(req.params.game, function(err, turn) {
		if (err) return next(err);
		res.send(turn);
	});

	//notify the drawer of what the word is

	//notify the other players
});

app.post('/data/game/:game/beginTurn', function(req, res, next) {
	if (!req.body.word  || !req.body.userIdentifier) {
		return res.send(400);
	}

	gameData.findTurn(req.params.game, function(err, turn) {
		if (err) return next(err);
		if (!turn) return res.send(404);
		console.log(turn);

		//validate word was actually one they had a choice of
		if (turn.choices.indexOf(req.body.word) === -1) {
			return res.send(400);
		}

		gameData.beginTurn(req.params.game, turn.identifier.toString(), req.body.word, function(err) {
			if (err) return next(err);
			res.send(200);
		});
	});
});

app.post('/data/game/:game/guessWord', function(req, res, next) {
	if (!req.body.word || !req.body.userIdentifier) return res.send(400);

	gameData.findTurn(req.params.game, function(err, turn) {
		if (err) return next(err);
		if (!turn) return res.send(404);

		if (turn.word.toLowerCase() === req.body.word.toLowerCase()) {
			//guessed the right word 

			//if correct go to next turn
			//gameData.createTurn();
		} else {
			//store guess
		}
	});

	
});

app.get('/data/game/:id', function(req, res, next) {
	if (!req.params.id) return res.send(400);

	gameData.findGame(req.params.id, function(err, game) {
		if(err) return next(err);
		if(!game) return res.send(404);
		res.send(game);
	});
});



server.listen(8123);