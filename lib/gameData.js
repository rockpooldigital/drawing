var ObjectID = require('mongodb').ObjectID;

module.exports = function(db) {
		//Determine the next player given the current set of turns
	function getNextPlayer(game) {
		var turns = game.turns;
		if (!turns || turns.length === 0) {
			return game.players[0];
		}

		var lastTurn = turns.pop();
		for (var i = 0; i < game.players.length; i++) {
			//find the player who had the last turn
			if (game.players[i].identifier.equals(lastTurn.playerIdentifier)) {
				//then return the next player
				var j = i + 1;
				if (j < game.players.length) {
					return game.players[j];
				} else {
					return game.players[0];
				}
			}
		}
	}


	function createChoices(next) {
		var buf = [];
		db.collection('categories')
			.find()
			.each(function(err, doc) {
				if (err) return next(err);
				if (doc === null) return next(null, buf);
				buf.push(
					doc.words[Math.floor(Math.random() * doc.words.length)]
				);
			})
	}


	function createTurn(gameId, next) {
		var games = db.collection('games');
		var _id = new ObjectID(gameId);
		games.findOne({ _id : _id }, function(err, game) {
			if (err) return next(err);
			if (!game) return next(new Error("Game not found"));

			//work out who
			var nextPlayer = getNextPlayer(game);

			console.log("next player is" + nextPlayer.name);

			createChoices(function(err, words) {
				if (err) return next(err);
				var turnId = new ObjectID();
				db.collection('games').update(
					{ _id : _id },
					{
						$push : {
							turns : {
								identifier : turnId,
								created : new Date(),
								playerIdentifier : nextPlayer.identifier,
								choices : words,

							}
						}
					},
					function(err) {
						if (err) return next(err);
						next(null, {
							identifier : turnId,
							player : nextPlayer,
							choices: words
						});
					}
				);
			})
		});
	}

	function joinGame(gameId, playerName, next) {
		var playerIdentifier = new ObjectID();
		var gameId = new ObjectID(gameId);
		db.collection('games').update(
			{ _id : gameId, },
			{ 
				$push : {
					players : { 
						name : playerName,
						identifier : playerIdentifier,
						joined : new Date()
					}
				},
				$set : {
					modified : new Date()
				}
			},
			{ upsert : true},
			function(err) {
				if (err) return next(err);
				next(null, playerIdentifier);
			}
		);
	}

	function findTurn(gameId, next) {
		//var tId = new ObjectID(turnIdentifier);
		db.collection('games').findOne({
			_id : new ObjectID(gameId)
		}, function(err, game) {
			if (err) return next(err);
			if (!game) return next(null, null);
			next(null, game.turns.pop());
		});
	}

	function beginTurn(gameId, turnId, word, next) {
		db.collection('games').update({
			_id : new ObjectID(gameId),
			"turns.identifier" : new ObjectID(turnId)
		}, { 
			$set : {
				"turns.$.word" : word,
				"turns.$.started" : new Date() 
			}
		}, function(err) {
			next(err);
		})
	}

	function completeTurn(gameId, turnId, playerId, next) {
		db.collection('games').update({
			_id : new ObjectID(gameId),
			"turns.identifier" : new ObjectID(turnId)
		}, { 
			$set : {
				"turns.$.guessed" : true,
				"turns.$.guessedAt" : new Date(),
				"turns.$.guessedBy" : new ObjectID(playerId)
			}
		}, function(err) {
			next(err);
		})
	}

	function findGame(id, next) { 
		db.collection('games').findOne({
			_id : new ObjectID(id)
		}, next);
	}
	return {
		createTurn : createTurn,
		joinGame : joinGame,
		findGame : findGame,
		findTurn : findTurn,
		beginTurn : beginTurn	,
		completeTurn:completeTurn
	}
}