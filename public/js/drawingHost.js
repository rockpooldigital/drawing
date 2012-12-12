var drawingHost = function($, data) {
	var socket = io.connect();
	
	var viewModel = {
		players : ko.observableArray(),
		id: ko.observable(''),
		joinUrl : ko.observable(''),
		state : ko.observable('waiting'),
		initialised : ko.observable(false),
		currentPlayer: ko.observable()
	};

	viewModel.startGame = function() {
		data.startGame(viewModel.id());
	};

	var Player = function(data) {
		return {
			name : ko.observable(data.name),
			score : ko.observable(0),
			id : ko.observable(data.playerId)
		}
	}

	function initialiseTurn(turn) {
		viewModel.currentPlayer({
			name : ko.observable(turn.player.name)
		});
		viewModel.state('word');
	}

	function changeState(state) {
		console.log(state);
		viewModel.state(state.state);
	}

	function initGame(id, joinUrl) {
		viewModel.id(id);
		viewModel.joinUrl(joinUrl);

		data.getPlayers(id).then(function(players) {
			if (players.length > 0) {
				ko.utils.arrayPushAll(viewModel.players(), players.map(function(p) {
					return new Player(p);
				}));
				viewModel.players.valueHasMutated();
			}

			socket.on('playerJoined', function(data) {
				viewModel.players.push(new Player(data));
			});
		});

		data.getState(id).then(function(state) {
			viewModel.initialised(true);
			socket.emit('host', id);
			changeState(state);
			socket.on('stateChange', changeState);
		}, function(e) {
			alert('Error fetching data');
		})
	}

	return {
		init : function(elem, gameId, joinUrl) {
			ko.applyBindings(viewModel, elem);
			console.log(joinUrl);
			initGame(gameId, joinUrl);			
		}
	}
}(jQuery, drawingData);