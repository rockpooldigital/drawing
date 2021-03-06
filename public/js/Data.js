var drawingData = function($) {
	return {
	/*	setupGame : function() {
			return $.post('/data/setupGame');
		},*/
		joinGame : function(id, playerName) {
			return $.post('/data/game/' + id + '/join', {
				id : id,
				playerName : playerName
			});
		},
		startGame: function(id){
			return $.post('/data/game/' + id + '/start'); 
		},
		getPlayers : function(id) {
			return $.get('/data/game/' + id + '/players'); 
		},

		getState : function(id) {
			return $.get('/data/game/' + id + '/state'); 
		},

		beginTurn : function(gameId, word) {
			return $.post('/data/game/' + gameId + '/beginTurn', {
				word : word
			});
		},
		submitGuess : function(gameId, playerId, word) {
			return $.post('/data/game/' + gameId + '/guessWord', {
				word : word,
				playerIdentifier :playerId
			});
		},
		passTurn : function(gameId, playerId) {
			return $.post('/data/game/' + gameId + '/pass', {
				playerIdentifier :playerId
			});
		}
	}
}(jQuery);