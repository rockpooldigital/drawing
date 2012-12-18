var drawingPlayer = function($, data) {
	var socket = io.connect();

	var viewModel = {
		initialised : ko.observable(false),
		gameId : ko.observable(''),
		playerId: ko.observable(''),
		state : ko.observable('waiting'),
		wordChoices : ko.observableArray(),
		turnId : ko.observable(),
		isCurrentPlayer : ko.observable(),
		word: ko.observable(),
		guess :ko.observable(""),
		view : ko.observable("wait")
	};

	var _editor;

	viewModel.submitGuess = function() {
		data.submitGuess(viewModel.gameId(), viewModel.playerId(), viewModel.guess())
					.then(function(result) {
						//if fail show alert
						if (!result.correct) {
							alert('Incorrect guess');
						} else {
							viewModel.guess('');
						}
						//if success then the game should move on anyway
					});
	}

	viewModel.chooseWord = function(word) {
		data.beginTurn(viewModel.gameId(), word);
	}


	var isDrawing =false;
	function onCommand(command){ 
		//if (isDrawing) {
			//alert('command')
			socket.emit('drawCommand', {
				command : command,
				player :  viewModel.playerId(),
				game : viewModel.gameId()
			});
		//}
	}

	function initEditor() {
		var elem = $('#drawing .painting')[0];
	//	setTimeout(function() {
			_editor = RockDrawing.Editor(elem);
			_editor.surface.onCommand = onCommand;
		//}, 100);
	}



	viewModel.initEditor = initEditor;

	function updateState(state) {
		console.log("STATE", state);

		var isCurrentPlayer = viewModel.playerId() === state.playerId;

		if (viewModel.isCurrentPlayer() === isCurrentPlayer && viewModel.state() === state.state) {
			console.log("No change");
			return;
		}

		var turn = state.turn || {};

		viewModel.isCurrentPlayer(isCurrentPlayer); 
		viewModel.state(state.state);
		viewModel.word(turn.word);
		viewModel.wordChoices(turn.choices);

		
		if (isCurrentPlayer && state.state === "word") {
			viewModel.view('word');
		} else if (isCurrentPlayer && state.state === "drawing") {
			//isDrawing= false;
			_editor.surface.clear();
			viewModel.view('draw');
		} else if (!isCurrentPlayer && state.state === "drawing") {
			//guess picture
			viewModel.view('guess');
		} else {
			//wait
					viewModel.view('wait');
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
		init : function(gameId, playerId) {
			ko.applyBindings(viewModel);
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