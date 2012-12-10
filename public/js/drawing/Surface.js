if (typeof(window.RockDrawing) === "undefined")	window.RockDrawing = {};
window.RockDrawing.TOOL_PEN = 1;
window.RockDrawing.CreateSurface = function(container) {
	var BUFFER_SIZE=  20;

	var surface = {
		TOOL_PEN : 1,
		onCommand : null
	};

	var ctx, 
			_canvas, 
 		 _backCanvas,
	 		_path;

		function outputCommand(c) {
			console.log(c);
			if (surface.onCommand) {
				surface.onCommand(c);
			}
		};

	 function path(toolSize, colour) {
	 		var _points = []
	 		, _pointIndex = 0
	 		, _tStart = new Date().getTime()
	 		, _x, _y;

	 		var path = { 
	 			onCommand : null
	 		};
	 		

	 		function pushPoints(i) {
	 			var set = _points.slice(i);
	 			
	 			var context = _backCanvas.getContext('2d');
 				if (set.length === 1) {
					placePoint(context, set[0][0], set[0][1], toolSize, colour);
				} else {
					drawSmoothLine(context, set,  toolSize, colour);
				}
				clear(_canvas, ctx);

				if (path.onCommand) {
					var now= new Date().getTime();
					var command = {
					//	tool : _tool,
						toolSize : toolSize,
						path : set,
						colour : colour,
						timeTaken : now - _tStart				
					};
					path.onCommand(command);
				}

				_tStart = new Date().getTime();
	 		}

	 		path.begin =  function(x,y) {
	 				ctx.beginPath();
					ctx.lineWidth = toolSize;
					ctx.strokeStyle = colour;
					ctx.lineCap = 'round';
	 				placePoint(ctx, x, y, toolSize, colour)
	 				_pointIndex = 0;
					_points = [[x,y]];
					_x=x;
					_y=y;
	 			};

	 		path.moveTo = function (x,y) {
					if (x=== _x && y===_y) return;
					
					drawLine(ctx,_x, _y, x, y);

					_x=x;_y=y;

					_points.push([x,y]);
					++_pointIndex;

					if (((_pointIndex+1)  % BUFFER_SIZE) === 0 ) {
						var start = _pointIndex - BUFFER_SIZE;
						if (start < 0) start = 0;
						pushPoints(start);
					}
	 			};

	 		path.end = function() {
						//push remaining points
						var start = BUFFER_SIZE * Math.floor((_pointIndex + 1) / BUFFER_SIZE);
						if (start > 0) --start;
						pushPoints(start);
	 			};


	 		return path;
	 }


	var bounds = container.getBoundingClientRect();

	function drawSmoothPath(context, set) {
		context.moveTo(set[0][0], set[0][1]);

		if (set.length > 4) {				 
			for (var i = 1; i < set.length - 2; i++) {
		    var c = (set[i][0] + set[i + 1][0]) / 2;
		    var d = (set[i][1] + set[i + 1][1]) / 2;
		 
		    context.quadraticCurveTo(set[i][0], set[i][1], c, d);
			}
		 
			// For the last 2 points
			context.quadraticCurveTo(
			    set[i][0],
			    set[i][1],
			    set[i + 1][0],
			    set[i + 1][1]
			);
		} else {
			for (var i = 1; i < set.length ; i++) {
		    context.lineTo(set[i][0], set[i][1]);
			}
		}
	}

	
	function redrawCanvas(canvas) {
		var buffer = document.createElement('canvas');
		var bounds = canvas.getBoundingClientRect();
		buffer.width =  bounds.width;
		buffer.height = bounds.height;

		var bufferCtx = buffer.getContext('2d');
		var context = canvas.getContext('2d');

		bufferCtx.drawImage(canvas, 0, 0);

		context.clearRect(0, 0, canvas.width, canvas.height);

		canvas.width = bounds.width;
		canvas.height = bounds.height;

		context.drawImage(buffer, 0, 0);
	}


	function drawSmoothLine(context, set, width, colour) {
		context.beginPath();
		context.lineWidth = width;
		context.strokeStyle = colour;
		context.lineCap = 'round';
		drawSmoothPath(context,set);
		context.stroke();
	}

	function drawLine(context,x1,y1,x2,y2,width, colour) {
		context.beginPath();
		context.moveTo(x1, y1);
		context.lineTo(x2, y2);
		context.stroke();
	}

	function placePoint(context,x,y, width, colour) {
		context.beginPath();
		var r = Math.floor((width + 0.0)/ 2);
		context.arc(x, y, r , 0, 2 * Math.PI, false);
		context.fillStyle = colour;
		context.fill();
	}

	function clear(canvas,context) {
			context.clearRect(0, 0, canvas.width, canvas.height);
	}

	function pushCommandWithAnimation(command, done) {
		var set = command.path, w = command.toolSize, c = command.colour;

		var context = 	_backCanvas.getContext('2d');

		if (set.length === 1) {
			placePoint(context, set[0][0], set[0][1], w, c);
		} else {
			var p = path(w, c);
			p.begin(set[0][0], set[0][1]);
			var f = function(i) {
				if(i >= set.length) {
					p.end();
					if (done) done();
				} else {
					p.moveTo(set[i][0], set[i][1]);
					setTimeout(function() {
						f(i+1);	
					}, interval);
				}
			};

			var interval = Math.floor((0.0 + command.timeTaken) / set.length);

			setTimeout(function() {
				f(1);	
			}, interval);
			
		}
	}

	//canvas
	_backCanvas = document.createElement("canvas");
	_backCanvas.classList.add("back");
	container.appendChild(_backCanvas);
	_backCanvas.width  = bounds.width;
	_backCanvas.height = bounds.height;
	
	//front drawing canvas
	_canvas = document.createElement("canvas");
	_canvas.classList.add("front");
	container.appendChild(_canvas);
	_canvas.width  = bounds.width;
	_canvas.height = bounds.height;

	var ctx = _canvas.getContext('2d'); 

	function beginDraw(size, colour, x,y)  { 
		if (_path) return;
		_path = path(size, colour);
		_path.onCommand = outputCommand;
		_path.begin(x,y);
	}

	function draw(x,y) {
		if (!_path) return;
		_path.moveTo(x,y);
	}

	function endDraw() {
		if (!_path) return;
		_path.end();
		_path = null;
	} 

	var yOffset = _canvas.offsetTop;

	surface.penDown = beginDraw;
	surface.penMove = draw;
	surface.penUp = endDraw;
	surface.frontCanvas = _canvas;
	surface.adjustSizeAndRedraw = function(){ 
		redraw(_canvas);
		redraw(_backCanvas);
	};

	surface.pushCommandWithAnimation = pushCommandWithAnimation;
	return surface;
}
