var drawingPlayer = function($, data) {
	var socket = io.connect();

	var viewModel = {
		initialised : ko.observable(false),
		//name:ko.observable(''),
		gameId : ko.observable(''),
		playerId: ko.observable(''),
		state : ko.observable('waiting'),
		wordChoices : ko.observableArray(),
		turnId : ko.observable(),
		isCurrentPlayer : ko.observable(),
		word: ko.observable()
	};

	viewModel.chooseWord = function(word) {
		//alert('You have chosen: ' + word)
		data.beginTurn(viewModel.gameId(), word)
		.then(function() {
			console.log(arguments);
		}, function() {
			console.log(arguments);
		})
	}

	function updateState(state) {
		console.log(state);

		var isCurrentPlayer = viewModel.playerId() === state.playerId;

		if (viewModel.isCurrentPlayer() === isCurrentPlayer && viewModel.state() === state.state) {
			console.log("No change");
			return;
		}

		viewModel.isCurrentPlayer(isCurrentPlayer); 
		viewModel.state(state.state);
		viewModel.word(state.turn.word);
		viewModel.wordChoices(state.turn.choices);
		if (isCurrentPlayer && state.state === "word") {
			
		} else if (isCurrentPlayer && state.state === "drawing") {

			//draw picture
		} else if (!isCurrentPlayer && state.state === "drawing") {
			//guess picture
		} else {
			//wait
		}
	}

	function init(gameId, playerId) {
		viewModel.playerId(playerId);
		viewModel.gameId(gameId);
		viewModel.initialised(true);

		data.getState(gameId).then(function(s) { 
			updateState(s);

			socket.emit('join',	gameId);
			socket.on('stateChange', updateState);
		});
	}	

	return {
		init : function(elem, gameId, playerId) {
			ko.applyBindings(viewModel, elem);
			if (playerId && playerId.length === 24) {
				init(gameId, playerId);
			} else {
				var name = prompt("Please enter your name");
				if (!name) {
					alert('Invalid name');
					return;
				}

				data.joinGame(gameId, name)
				.then(function(playerId) {
					window.location.hash= playerId;
					init(gameId, playerId);
				}, function() {
					alert('Error joining game')
				});
			}
		}
	}
}(jQuery, drawingData);