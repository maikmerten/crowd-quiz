var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var argv = require('yargs').argv;
var auth = require('./auth');

var quizcodes = [];

if(argv.username && argv.password) {
	auth.addAdmin(argv.username, argv.password);
} else {
	console.log("#############################################################");
	console.log("# Authentication for /quizmaster page disabled!             #");
	console.log("# Invoke with --username=user --password=pass if undesired! #");
	console.log("#############################################################");
	auth.setAuthEnabled(false);
}

// determine if minified JavaScript resources are served
var minjs = ".min";
if(argv.debug) {
	console.log("### Serving non-minified JavaScript libraries!");
	minjs = "";
}

// determine port to be used, the default is port 3000
var port = 3000;
if(argv.port) {
	port = argv.port;
}

http.listen(port, function(){
	console.log('listening on *:' + port);
});

app.use(express.static('static'));


app.get('/', function(req, res){
	res.sendFile(__dirname + '/resources/client.html');
});

app.get('/quizmaster', auth.handleRequest, function(req, res){
	res.sendFile(__dirname + '/resources/quizmaster.html');
});

app.get('/editor', function(req, res){
	res.sendFile(__dirname + '/resources/editor.html');
});

app.get('/jquery.js', function(req, res){
	res.sendFile(__dirname + '/resources/jquery-1.11.1' + minjs + '.js');
});

app.get('/i18next.js', function(req, res){
	res.sendFile(__dirname + '/resources/i18next-1.9.0' + minjs + '.js');
});

io.on('connection', function(socket){
	console.log('a user connected');

	socket.on('JoinRoom', function(rooms) {
		if(!rooms || !rooms.length) return;
		console.log("client joins room(s) " + rooms);
		for(var i = 0; i < rooms.length; ++i) {
			socket.join(rooms[i]);
		}
	});


	// deliver discovery requests from clients to quizmasters
	socket.on("DiscoveryRequest", function(request) {
		if(!request || !request.code) return;
		var request = {
			"code" : request.code,
			"clientid" : socket.id
		};
		io.in("quizmaster").emit("DiscoveryRequest", request);
	});

	// deliver discovery responses from quizmasters to client
	socket.on("DiscoveryResponse", function(response) {
		if(!response) return;
		io.in(response.recipient).emit("DiscoveryResponse", response);
	});

	// distribute questions to quiz clients
	socket.on("QuizQuestion", function(questionEnvelope) {
		if(!questionEnvelope || !questionEnvelope.question || !questionEnvelope.quizinstance) return;

		var question = questionEnvelope.question;
		var quizinstance = questionEnvelope.quizinstance;

		if(questionEnvelope.recipient) {
			// if question is targeted at specific client, deliver there
			io.in(questionEnvelope.recipient).emit("QuizQuestion", question);
		} else {
			// otherwise deliver to all clients of this quiz instance
			//console.log(quizinstance + ": " + question.text);
			io.in("clients." + quizinstance).emit("QuizQuestion", question);
		}
	});

	socket.on("RequestQuestion", function(request) {
		if(!request || !request.quizinstance) return;
		console.log("question requested, quizinstance " + request.quizinstance);
		request.clientid = socket.id;
		io.in("quizmaster." + request.quizinstance).emit("RequestQuestion", request);
	});

	// forward answers to quiz master
	socket.on("QuizAnswer", function(answer) {
		if(!answer || !answer.quizinstance) return;
		// determine number of clients for this quiz
		var room = io.sockets.adapter.rooms["clients." + answer.quizinstance];
		answer.totalClients = room ? Object.keys(room).length : 1;
		io.in("quizmaster." + answer.quizinstance).emit("QuizAnswer", answer);
	});

	// forward correct option to clients
	socket.on("RevealCorrect", function(revealMsg) {
		if(!revealMsg || !revealMsg.quizinstance) return;
		io.in("clients." + revealMsg.quizinstance).emit("RevealCorrect");
	});


	socket.on("RequestQuizCode", function(request) {
		var code = 1337;
		do {
			code = Math.floor(Math.random() * 100000);
		} while(quizcodes.includes(code));

		quizcodes.unshift(code);
		while(quizcodes.length > 100) {
			quizcodes.pop();
		}

		socket.emit("RequestQuizCodeResponse", {"quizcode" : "" + code});
	});

	socket.on("pong", function(msg) {
		//console.log("Pong received from client");
	});

	socket.on('disconnect', function(){
		console.log('user disconnected');
	});
});


function sendHeartbeat(){
    setTimeout(sendHeartbeat, 9999);
    io.sockets.emit('ping', "Ping!");
}
setTimeout(sendHeartbeat, 9999);


