var drawingPlayer = function($, data) {
	var socket = io.connect();

	var viewModel = {
		initialised : ko.observable(false),
		name:ko.observable(''),
		gameId : ko.observable(''),
		playerId: ko.observable(''),
		status : ko.observable('waiting')
	};

	function init(gameId, playerId, name) {
		viewModel.playerId(playerId);
		viewModel.gameId(gameId);
		viewModel.name(name);
		viewModel.initialised(true);

		socket.emit('join',	gameId);
		socket.on('turnInit', function(turnPlayerId) {
			if (playerId === turnPlayerId) {
				alert('it is your turn');
			}
		});
	}	

	return {
		init : function(elem, gameId, playerId) {
			ko.applyBindings(viewModel, elem);

			var name = prompt("Please enter your name");
			if (!name) {
				alert('Invalid name');
				return;
			}
			console.log(gameId);
			viewModel.name(name);
			data.joinGame(gameId, name)
				.then(init, function() {
					alert('Error joining game')
				});
			}
	}
}(jQuery, drawingData);