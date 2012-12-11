DrawingData = function($) {
	return {
		setupGame : function() {
			return $.post('/data/setupGame');
		},
		joinGame : function(id, playerName) {
			return $.post('/data/joinGame', {
				id : id,
				playerName : playerName
			});
		},
	}
}(jQuery);