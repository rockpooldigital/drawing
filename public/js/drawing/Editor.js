

RockDrawing.Editor = function(element) {
	var palette = [ 
		'#000', '#7F7F7F', '#FFF','#880015', '#ED1C24', '#FF7F27', '#FFF200', '#22B14C', '#00A2E8', '#3F48CC', '#A349A4'
	];

	var _drawingOffset, _surface;

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


//return
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

		var pen = RockDrawing.TOOL_PEN;

		appendTool('f', pen, 1);
		var t1 = appendTool('s', pen, 4);
		appendTool('m', pen, 8);
		appendTool('l', pen, 16);
		appendTool('xl', pen, 32);

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
		_surface.setColour(newColour);
	});

	setupTools(controls, function(newTool, newToolSize) {
		_surface.setTool(newTool, newToolSize);
	});

	_drawingOffset = drawing.getBoundingClientRect();
	_surface= RockDrawing.CreateSurface(drawing);


	function resizeCanvases() {
		_surface.adjustSizeAndRedraw();
		_drawingOffset = drawing.getBoundingClientRect();
	}

  var orientationEvent = ("onorientationchange" in window) ? "orientationchange" : "resize";

	window.addEventListener(orientationEvent, function() {
		resizeCanvases();
	}, false);


	function touchEvent(callback, preventDefault) {
		return function(e) {
			if (preventDefault) e.preventDefault();
			var x = e.touches[0].pageX ;
			var y = e.touches[0].pageY - _drawingOffset.top;
			callback(x,y);
		};
	}

	var canvas = _surface.frontCanvas;

	if ("ontouchstart" in window) {
		canvas.ontouchstart= touchEvent(_surface.penDown, true);
		canvas.ontouchmove = touchEvent(_surface.penMove, true);
		canvas.ontouchend = _surface.penUp;
	} else {
		canvas.onmousedown = function(e) { 
			if (typeof(e.offsetX) === 'undefined') {
				_surface.penDown(e.layerX, e.layerY); 
			} else {
				_surface.penDown(e.offsetX, e.offsetY); 
			}
		};

		canvas.onmousemove = function(e) { 
		 if (typeof(e.offsetX) === 'undefined') {
				_surface.penMove(e.layerX, e.layerY); 
			} else {
				_surface.penMove(e.offsetX, e.offsetY); 
			}
		};
		canvas.onmouseup =  function(e) { _surface.penUp(); };
		canvas.onmouseout = function(e) { _surface.penUp(); }
	}

	return {
		surface : _surface
	};
}