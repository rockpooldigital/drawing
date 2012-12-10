var express = require('express');
//var mongodb = require('mongodb');
//var ObjectID = require('mongodb').ObjectID;
//var DBRef = require('mongodb').DBRef;
var app = express()
	,server = require('http').createServer(app);

//app.engine('.html', require('ejs').__express);
//app.set('views', __dirname + '/views');
//app.set('view engine', 'html');
app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'));


var io = require('socket.io').listen(server);
io.set('log level', 1); 
io.sockets.on('connection', function(socket) {
	socket.on('draw', function(data) {
			    socket.broadcast.emit('draw', data);
	});

	/*	socket.on('device:location', function(data) {
			    socket.broadcast.emit('device:location', data);
	});*/
});


server.listen(8123);
/*

var db = new mongodb.Db('nodejitsu_tomhaigh_nodejitsudb6190398759', new mongodb.Server('ds039257.mongolab.com', 39257),
			{ safe :true}
);

db.open(function (err, db_p) {
	db.authenticate('nodejitsu_tomhaigh', 'u30jvkuqbr6ba56l4mg2u91h7h', function (err, replies) {
	if (err) { console.log(err); return; }
		setup(db);
	});
});


function setup(db) {

	console.log("index");
	   // You are now connected and authenticated.
	db.collection('redemptions')
		.ensureIndex({
			'redeemedOn' : 1
		}, {safe:true}, function(err, r) {
			if( err) {
				console.log(err);
			} else {
				console.log("ok", r);
			}
	});

*/