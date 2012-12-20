var countdownTimer = (function($) {
	function init(element) {
		//console.log(element);
		var t = $(element).find('.timerSecs')[0];
		var w = element;
		///var s = t.innerText;
		var i = null;

		var endTime;

		function start(secs) { 
			var s = parseInt(secs);
			endTime = new Date(new Date().getTime() + s*1000);
			w.classList.add("spin");
			interval();
		}

		function stop(){
			w.classList.remove("spin");
			if (i) {
				window.clearInterval(i);
				i= null;
			}	
		}

		interval = function(){
			var f = function() {
				var now = new Date();
				var s =Math.ceil((endTime - now) / 1000);
				t.innerText = s;
				if(s <= 0){
					stop();
					return;
				}
			}
			i = window.setInterval(f, 500); 
			f();
		}
		return {
			start : start, 
			stop : stop
		}
	}
	return init;
})(jQuery);


var drawingHost = function($, data) {

	var viewModel = {
		players : ko.observableArray(),
		id: ko.observable(''),
		joinUrl : ko.observable(''),
		state : ko.observable('waiting'),
		initialised : ko.observable(false),
		turn :ko.observable()
	};

	viewModel.started = ko.computed(function() {
		return viewModel.state() !== 'waiting';
	});

	viewModel.playerCount = ko.computed(function() {
		return viewModel.players().length;
	});

	viewModel.pendingStart = ko.computed(function() {
		return !viewModel.started() && viewModel.playerCount() >= 2;
	});

	viewModel.currentPlayer = ko.computed(function() {
		var turn = viewModel.turn();
		if (!turn) { return null; }
		if (turn.playerIdentifier) {
			var player = ko.utils.arrayFirst(viewModel.players(), function(p) {
				return p.id() === turn.playerIdentifier;
			});

			return player;
		}
		return null;
	});

	viewModel.startGame = function() {
		data.startGame(viewModel.id());
	};

	var Player = function(data) {
		var result =  {
			name : ko.observable(data.name),
			score : ko.observable(data.score),
			id : ko.observable(data.identifier)
		}
		return result;
	}

	function changeState(state) {
		console.log(state);
		viewModel.state(state.state);
		viewModel.turn(state.turn);
		_surface.clear();
		if (state.state === 'drawing') {
			timer.start(90);
		} else {
				//	timer.start(20)
			timer.stop();
		}
	}

	var _surface, timer;

	function setPlayers(players) {
		viewModel.players.removeAll();
		ko.utils.arrayPushAll(viewModel.players(), players.map(function(p) {
					return new Player(p);
				}));
		
		viewModel.players.sort(function(a,b) { return a.score - b.score; });
		viewModel.players.valueHasMutated();
	}	

	function initGame(id, joinUrl) {
		timer = countdownTimer($('#timerWrapper')[0]);

		var socket = io.connect();
		viewModel.id(id);
		viewModel.joinUrl(joinUrl);
		var canvasDiv = $('#canvasWrapper')[0];
		//console.log($('#canvasWrapper'));

		_surface= RockDrawing.CreateSurface(canvasDiv);

		data.getPlayers(id).then(function(players) {
			if (players.length > 0) {
				setPlayers(players);
			}

			socket.on('playerJoined', function(data) {
				viewModel.players.push(new Player(data));
			});
		});

		//should update rather than just reloading whole list
		socket.on('scoreUpdate', function(players) {
			setPlayers(players);

		});

		data.getState(id).then(function(state) {
			viewModel.initialised(true);
			socket.emit('host', id);
			socket.on('reconnect', function() {
				socket.emit('host', id);
			});
			changeState(state);
			socket.on('stateChange', changeState);
		}, function(e) {
			alert('Error fetching data');
		});


		var buffer = [];
		var processNext;
		var isDrawing = false;

		processNext = function() {
			if (buffer.length > 0) {
				isDrawing = true;
				//console.log("executing command");
				_surface.redrawCommand(buffer.shift(), processNext);
			} else {
				isDrawing = false;
			}
		}

		function preProcessCommand(data) {
			if (data.command.path) {
				var maxPlayerCanvas = Math.max(data.screenWidth, data.screenHeight);
				
				if (maxPlayerCanvas) {
					var ourCanvasMin = Math.min(drawingDiv.width(), drawingDiv.height());

					var scalar = ourCanvasMin / maxPlayerCanvas;
					//console.log("our", ourCanvasMin, "player", maxPlayerCanvas);
					//console.log(scalar);
					data.command.toolSize = Math.round(data.command.toolSize * scalar); 
					data.command.path = data.command.path.map(function(p) {
						return [
							Math.round(p[0] * scalar), 
							Math.round(p[1] * scalar)
						];
					});
				}
			}
		}

		var drawingDiv = $('#canvasWrapper');

		socket.on('drawCommand', function(data) {
			preProcessCommand(data);

			buffer.push(data.command);

			if (!isDrawing) {
				processNext();
			}
		});
	}

	return {
		init : function(elem, gameId, joinUrl) {
			ko.applyBindings(viewModel, elem);
			//console.log(joinUrl);
			initGame(gameId, joinUrl);			
		}
	}
}(jQuery, drawingData);