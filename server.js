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

app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
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
	socket.on('join', function(game) {
		console.log("joining" , game);
		socket.join(game + '/player');
		socket.join(game);
	});
	socket.on('host', function(game) {
		socket.join(game + '/host');
		socket.join(game);
	});
	socket.on('drawCommand', function(cmd) {
		io.sockets.in(cmd.game + '/host').emit('drawCommand', cmd);
	});
});


app.post('/data/game/:id/join', function(req, res, next) {
	console.log(req.body);
	if (!req.params.id || !req.body.playerName) {
		return res.send(400);
	}

	gameData.joinGame(req.params.id, req.body.playerName, function(err, identifier) {
		if (err) return next(err);
		res.send(identifier);
		io.sockets.in(req.params.id + '/host').emit('playerJoined', {
			name : req.body.playerName,
			playerId: identifier
		});
		pushStateNotificationForGameId(req.params.id);
	});
});

function nextTurn(gameId, next) {
	gameData.createTurn(gameId, function(err, turn) {
		if (err) return next(err);
		pushStateNotificationForGameId(gameId, next);
	});
}


app.post('/data/game/:game/start', function(req, res, next) {
	if (!req.params.game) return res.send(400);
	nextTurn(req.params.game, function(err, turn) {
		if (err) return next(err);
		res.send(turn);
	});
});

app.post('/data/game/:game/beginTurn', function(req, res, next) {
	if (!req.body.word ) {
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
			pushStateNotificationForGameId(req.params.game);
		});
	});
});

app.post('/data/game/:game/guessWord', function(req, res, next) {
	if (!req.body.word || !req.body.playerIdentifier) return res.send(400);

	gameData.findTurn(req.params.game, function(err, turn) {
		console.log("cb findTurn", err, turn);
		if (err) return next(err);
		if (!turn || !turn.word) return res.send(404);

		if (turn.word.toLowerCase() !== req.body.word.toLowerCase()) {
			//todo: store guess
			return 	res.send({
				correct: false
			});
		}

		//guessed the right word 
		gameData.completeTurn(req.params.game, turn.identifier.toString(), req.body.playerIdentifier, function(err) {
			if (err) return next(err);
			pushScoreUpdate(req.params.game, function(err) {
				if (err) return next(err);
				nextTurn(req.params.game, function(err, turn) {
					if (err) return next(err);
					res.send({ correct: true });
				});
			});
		}) 
	});
});

app.post('/data/game/:game/pass', function(req, res, next) {
	if (!req.params.game || !req.body.playerIdentifier) return res.send(400);	

	gameData.findTurn(req.params.game, function(err, turn) {
		if (err) return next(err);
		if (!turn) return res.send(404);

	gameData.passTurn(req.params.game, turn.identifier.toString(), req.body.playerIdentifier, function(err) {
			if (err) return next(err);
			nextTurn(req.params.game, function(err, turn) {
				if (err) return next(err);
				res.send({ correct: true });
			});
		}) 
	});
});

app.get('/data/game/:id/players', function(req, res, next) {
	if (!req.params.id) return res.send(400);

	gameData.findGame(req.params.id, function(err, game) {
		if(err) return next(err);
		if(!game) return res.send([]);

		res.send(game.players || []);
	});
});

function generateStateMessage(game) {
	if(!game || !game.turns || !game.turns.length) return {
		state : 'waiting',
		//turnId: null,
		playerId :null,
		turn  :null
	};

	var turn = game.turns.pop();

	var result = {
		turn : turn,
		//turnId : turn.identifier,
		playerId : turn.playerIdentifier
	};

	if (!turn.word) {
		result.state= 'word';
	} else if (!turn.completed) {
		result.state = 'drawing';
	} else if (turn.completed) {
		result.state = 'results';
	}

	return result;
}

function pushStateNotification(game, next) {
	var msg = generateStateMessage(game);

	io.sockets.in(game._id.toString()).emit('stateChange', msg);
	if (next) {
	 	next(null);
	}
}

function pushStateNotificationForGameId(gameId, next) {
	gameData.findGame(gameId, function(err, game) {
		if (err) return next(err);
		pushStateNotification(game, next);
		//if (next) return next(game);
	});
}

function pushScoreUpdate(gameId, next) {
	gameData.findGame(gameId, function(err, game) {
		if (err) return next(err);
		io.sockets.in(game._id.toString() + '/host')
							.emit('scoreUpdate', game.players);
		console.log("PLAYER", game._id.toString() + '/host', game.players);
		next();
	});
}

app.get('/data/game/:id/state', function(req, res, next) {
	if (!req.params.id) return res.send(400);

	gameData.findGame(req.params.id, function(err, game) {
		if(err) return next(err);
		res.send(generateStateMessage(game));
	});
});

///Pages

app.get('/game/:gameId', function(req, res) {
	if (!/^[a-z0-9]{24}$/i.test(req.params.gameId)) return res.send(400);

	res.render('host', { 
		gameId : req.params.gameId,
		joinUrl : config.URL + '/play/' + req.params.gameId,
	});
});

app.get('/play/:gameId', function(req, res) {
	if (!/^[a-z0-9]{24}$/i.test(req.params.gameId)) return res.send(400);
	res.render('play', { 
		gameId : req.params.gameId
	});
});

app.get('/', function(req, res) {
	res.redirect('/game/' + new ObjectID());
});


server.listen(config.PORT);