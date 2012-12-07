
window.RockDrawing.TOOL_PEN = 1;
window.RockDrawing.CreateSurface = function(container) {
	var BUFFER_SIZE=  15;

	var surface = {
		TOOL_PEN : 1,
		onDataReady : null
	};

	var _x, _y, 
			_colour, _isDrawing = false, 
			ctx, 
			_canvas, _tool = surface.TOOL_PEN, 
	 		_toolSize = 4,
	 		 _points = [] , _pointIndex = 0, _colour = "#000";



	var bounds = container.getBoundingClientRect();

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
	

	var _backing = RockDrawing.Canvas(_backCanvas);
	var _front = RockDrawing.Canvas(_canvas);
	var ctx = _canvas.getContext('2d'); 

	function pushPoints(start) {
		var set = points.slice(start);
		var command = {
			tool : _tool,
			toolSize : _toolSize,
			path : set,
			colour : _colour				
		};

		/*if (surface.onDataReady) {
			surface.onDataReady(command);
		}*/
		console.log(command);
		_backing.pushCommand(command);		
		_front.clear();
	}

	function beginDraw(x,y)  { 
		if (_isDrawing) return;
		_isDrawing = true;
		
		_front.placePoint(x, y, _toolSize, _colour);
		_x=x;_y=y;
		_pointIndex = 0;
		points = [[x,y]];
		
		ctx.beginPath();
		ctx.lineWidth = _toolSize;
		ctx.strokeStyle = _colour;
		ctx.lineCap = 'round';
	}

	function draw(x,y) {
		if (!_isDrawing) return;
		if (x=== _x && y===_y) return;
	
		_front.drawLine(_x, _y, x, y);

		_x=x;_y=y;

		points.push([x,y]);
		++_pointIndex;

		if (((_pointIndex+1)  % BUFFER_SIZE) === 0 ) {
			var start = _pointIndex - BUFFER_SIZE;
			if (start < 0) start = 0;
			pushPoints(start);
		}
	}

	function endDraw() {// alert('blur');
		if (!_isDrawing) return;
		_isDrawing = false;
	
		//push remaining points
		var start = BUFFER_SIZE * Math.floor((_pointIndex + 1) / BUFFER_SIZE);
		if (start > 0) --start;
		pushPoints(start);
	} 

	var yOffset = _canvas.offsetTop;

	surface.penDown = beginDraw;
	surface.penMove = draw;
	surface.penUp = endDraw;
	surface.setTool = function(tool, size) {
		_toolSize = size;
		_tool = tool;
	}
	surface.setColour = function(col) {
		_colour = col;
	}
	surface.frontCanvas = _canvas;
	surface.adjustSizeAndRedraw = function(){ 
		_front.redraw();
		_backing.redraw();
	};
	return surface;
}
