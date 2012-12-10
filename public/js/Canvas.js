

window.RockDrawing.Canvas = function(canvas) {
	var  _backCanvas = canvas;
	var _context = canvas.getContext('2d');
	
	function drawSmoothPath(set) {
		_context.moveTo(set[0][0], set[0][1]);

		if (set.length > 4) {				 
			for (var i = 1; i < set.length - 2; i++) {
		    var c = (set[i][0] + set[i + 1][0]) / 2;
		    var d = (set[i][1] + set[i + 1][1]) / 2;
		 
		    _context.quadraticCurveTo(set[i][0], set[i][1], c, d);
			}
		 
			// For the last 2 points
			_context.quadraticCurveTo(
			    set[i][0],
			    set[i][1],
			    set[i + 1][0],
			    set[i + 1][1]
			);
		} else {
			for (var i = 1; i < set.length ; i++) {
		    _context.lineTo(set[i][0], set[i][1]);
			}
		}
	}

	function redrawCanvas() {
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

	function drawSmoothLine(set, width, colour) {
		_context.beginPath();
		_context.lineWidth = width ;
		_context.strokeStyle = colour;
		_context.lineCap = 'round';
		drawSmoothPath(set);
		_context.stroke();
	}

	function drawLine(x1,y1,x2,y2,width, colour) {
		_context.beginPath();
		_context.lineWidth = width;
		_context.strokeStyle = colour;
		_context.moveTo(x1, y1);
		_context.lineTo(x2, y2);
		_context.stroke();
	}

	function placePoint(x,y, width, colour) {
		_context.beginPath();
		var r = Math.floor((width + 0.0)/ 2);
		_context.arc(x, y, r , 0, 2 * Math.PI, false);
		_context.fillStyle = colour;
		_context.fill();
	}

	function drawPoints(set, w, c) {
	if (set.length === 1) {
			placePoint(set[0][0], set[0][1], w, c);
		} else {
			drawSmoothLine(set, w,c );
		}
	}

	return {
		pushCommand : function(command) {
			drawPoints(
				command.path,
				command.toolSize,
				command.colour
			);
		},
		//initPen : initPen,
		placePoint :placePoint,
		drawSmoothLine : drawSmoothLine,
		clear :function() {
			_context.clearRect(0, 0, canvas.width, canvas.height);
		},
		drawLine: drawLine,
		redraw : redrawCanvas
	}
}
