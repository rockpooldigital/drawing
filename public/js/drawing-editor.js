var canvasHelper = function() {
	function drawSmoothLine(context, set) {
		console.log("drawing", set.length);
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

	return {
		drawSmoothPath : drawSmoothLine,
		redrawCanvas : redrawCanvas
	}
}();

var drawingEditor= (function(factory) {
	return {
		init : factory
	};
})(function(element) {

	var palette = [ 
		'#000', '#7F7F7F', '#FFF','#880015', '#ED1C24', '#FF7F27', '#FFF200', '#22B14C', '#00A2E8', '#3F48CC', '#A349A4'
	];

	var _x, _y, _colour = palette[0],
	 _isDrawing = false, 
	 _tool = TOOL_PEN, 
	 _toolSize = 4, 
	 points = [], 
	_canvas
	, _backCanvas
	, _drawingOffset
	, _pointIndex = 0;

	var TOOL_PEN = 1, BUFFER_SIZE= 30;//, TOOL_ERASER = 2;

	//create div inside
	var container = document.createElement("div");
	container.classList.add("touch-drawing");
	container.classList.add('clearfix');
	element.appendChild(container);

	//drawing controls (upper)
	var controls = document.createElement('div');
	controls.classList.add("controls");
	controls.classList.add("upper");
	container.appendChild(controls);

	var drawing = document.createElement('div');
	container.appendChild(drawing);
	drawing.style.height=(container.offsetHeight-40) + "px";
	drawing.classList.add('drawing');
	_drawingOffset = drawing.getBoundingClientRect();

	//drawing controls (lower)
	var controlsLower = document.createElement('div');
	controlsLower.classList.add("controls");
	controlsLower.classList.add("lower");
	container.appendChild(controlsLower);

	function setupColours(parent, onChange) {
		//colour palette
		var colours = document.createElement('ul');
		colours.classList.add('colours');
		var all = new Array(palette.length);
		for (var j=0;j<palette.length;j++) {
			var li = document.createElement('li');
			li.style.backgroundColor = palette[j];
			li.dataset['c'] = palette[j];
			colours.appendChild(li);
			var a = document.createElement('a');
			a.href = '#';
			li.appendChild(a);
			all[j] = li;
		}
		parent.appendChild(colours);
		all[0].classList.add('selected');
	
		colours.onclick =  function(e) {
			//alert('click');
			if (e.target && e.target.nodeName === 'A') {
				e.preventDefault();
				var c = e.target.parentElement.dataset['c'];
				if (c && onChange) {
					onChange(c);
				}
				for (var j = 0; j < all.length; j++) {
					if (all[j] === e.target.parentElement) {
						all[j].classList.add('selected');
					} else {
						all[j].classList.remove('selected');
					}
				}
			}
		}
	}

	function setupTools(parent, onChange) {
		var tools = document.createElement('ul');
		tools.classList.add('tools');
		parent.appendChild(tools);
		var all = [];

		function appendTool(label, tool, size) {
			var t1 = document.createElement('li');
			var a = document.createElement('a');
			a.textContent= label;
			a.href='#';
			t1.dataset['tool'] = tool;
			t1.dataset['size'] = size;
			t1.classList.add('size-' + size);
			t1.classList.add('tool-' + tool);
			t1.appendChild(a);
			tools.appendChild(t1);
			all.push(t1);
			return t1;
		}

		appendTool('f', TOOL_PEN, 1);
		var t1 = appendTool('s', TOOL_PEN, 4);
		appendTool('m', TOOL_PEN, 8);
		appendTool('l', TOOL_PEN, 16);
		appendTool('xl', TOOL_PEN, 32);

		tools.onclick = function(e) {
			if (e.target && e.target.nodeName === 'A') {
				onChange(e.target.parentElement.dataset['tool'], parseInt(e.target.parentElement.dataset['size']));
				for (var j = 0; j < all.length; j++) {
					if (all[j] === e.target.parentElement) {
						all[j].classList.add('selected');
					} else {
						all[j].classList.remove('selected');
					}
				}
			}	
		}

		t1.classList.add('selected');
	}

	setupColours(controlsLower, function(newColour) {
		_colour = newColour;
	});

	setupTools(controls, function(newTool, newToolSize) {
		_tool = newTool;
		_toolSize = newToolSize;
	});

	function setCanvasDimensions(container, canvas) {
		var bounds = container.getBoundingClientRect();
		canvas.width  = bounds.width;
		canvas.height = bounds.height;
	}

	function resizeCanvases() {
		canvasHelper.redrawCanvas(_backCanvas);
		canvasHelper.redrawCanvas(_canvas);
		_drawingOffset = drawing.getBoundingClientRect();
	}

	//canvas
	_backCanvas = document.createElement("canvas");
	_backCanvas.classList.add("back");
	drawing.appendChild(_backCanvas);
	setCanvasDimensions(drawing, _backCanvas);

	//front drawing canvas
	_canvas = document.createElement("canvas");
	setCanvasDimensions(drawing, _canvas);
	_canvas.classList.add("front");
	drawing.appendChild(_canvas);

	var ctx = _canvas.getContext('2d');

	function pushPoints(start, end) {
		var set = points.slice(start);
		if (set.length === 1) {
			placePoint(_backCanvas.getContext('2d'), set[0][0], set[0][1]);
		} else {
			drawSmoothLine(set);
		}
		ctx.clearRect(0, 0, _canvas.width, _canvas.height);
	}

	function initPen(context) {
		context.beginPath();
		context.lineWidth = _toolSize;
		context.lineCap = 'round';
		context.strokeStyle = _colour;
	}
	
	function drawSmoothLine(set) {
		var context = _backCanvas.getContext('2d');
		initPen(context);
		canvasHelper.drawSmoothPath(context, set);
		context.stroke();
	}

	function placePoint(context,x,y) {
		context.beginPath();
		var r = Math.floor((_toolSize + 0.0)/ 2);
		context.arc(x, y, r , 0, 2 * Math.PI, false);
		//context.strokeStyle = _colour;
		context.fillStyle = _colour;
		context.fill();
	}


	function beginDraw(x,y)  { 
		if (_isDrawing) return;
		_isDrawing = true;
		
			placePoint(ctx, x, y);
		_x=x;_y=y;
		_pointIndex = 0;
		points = [[x,y]];
		initPen(ctx);
	}

	function draw(x,y) {
		if (!_isDrawing) return;

		ctx.beginPath();
		ctx.moveTo(_x,_y);
		ctx.lineTo(x, y);
		ctx.stroke();

		_x=x;_y=y;

		points.push([x,y]);
		++_pointIndex;

		if (((_pointIndex+1)  % BUFFER_SIZE) === 0 ) {
			var start = _pointIndex - BUFFER_SIZE;
			if (start < 0) start = 0;
			pushPoints(start, _pointIndex);
		}
	}

	function endDraw() {
		_isDrawing = false;
	
		//push remaining points
		var remainingPoints = (_pointIndex + 1) % BUFFER_SIZE;
		var start = BUFFER_SIZE * Math.floor((_pointIndex + 1) / BUFFER_SIZE);
		if (start > 0) --start;
		pushPoints(
			start,
			(_pointIndex + 1) % BUFFER_SIZE
		);
	} 

	var yOffset = _canvas.offsetTop;

	function touchEvent(callback, preventDefault) {
		return function(e) {
			if (preventDefault) e.preventDefault();
			var x = e.touches[0].pageX ;
			var y = e.touches[0].pageY - _drawingOffset.top;
			callback(x,y);
		};
	}

	if ("ontouchstart" in window) {
		_canvas.ontouchstart= touchEvent(beginDraw, true);
		_canvas.ontouchmove = touchEvent(draw, true);
		_canvas.ontouchend = endDraw;
	} else {
		_canvas.onmousedown = function(e) { 
			if (typeof(e.offsetX) === 'undefined') {
				beginDraw(e.layerX, e.layerY); 
			} else {
				beginDraw(e.offsetX, e.offsetY); 
			}
		};

		_canvas.onmousemove = function(e) {
		 if (typeof(e.offsetX) === 'undefined') {
				draw(e.layerX, e.layerY); 
			} else {
				draw(e.offsetX, e.offsetY); 
			}
		};
		_canvas.onmouseup =  function(e) { endDraw(); };
	}

  var orientationEvent = ("onorientationchange" in window) ? "orientationchange" : "resize";

	window.addEventListener(orientationEvent, function() {
		resizeCanvases();
	}, false);

	return {

	};
});