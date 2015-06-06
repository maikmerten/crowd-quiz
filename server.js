var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var argv = require('yargs').argv;
var auth = require('./auth');

if(argv.username && argv.password) {
	auth.addAdmin(argv.username, argv.password);
} else {
	console.log("#############################################################");
	console.log("# Authentication for /quizmaster page disabled!             #");
	console.log("# Invoke with --username=user --password=pass if undesired! #");
	console.log("#############################################################");
	auth.setAuthEnabled(false);
}

http.listen(3000, function(){
	console.log('listening on *:3000');
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
	res.sendFile(__dirname + '/resources/jquery-1.11.1.js');
});

app.get('/shared.js', function(req, res){
	res.sendFile(__dirname + '/resources/shared.js');
});

app.get('/styles.css', function(req, res){
	res.sendFile(__dirname + '/resources/styles.css');
});


io.on('connection', function(socket){
	console.log('a user connected');

	socket.on('JoinRoom', function(rooms) {
		console.log("client joins room(s) " + rooms);
		for(var i = 0; i < rooms.length; ++i) {
			socket.join(rooms[i]);
		}
	});


	// deliver discovery requests from clients to quizmasters
	socket.on("DiscoveryRequest", function() {
		var request = {
			"clientid" : socket.id
		};
		io.in("quizmaster").emit("DiscoveryRequest", request);
	});

	// diliver discovery responses from quizmasters to client
	socket.on("DiscoveryResponse", function(response) {
		io.in(response.recipient).emit("DiscoveryResponse", response);
	});

	// distribute questions to quiz clients
	socket.on("QuizQuestion", function(questionEnvelope) {
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
		console.log("question requested, quizinstance " + request.quizinstance);
		request.clientid = socket.id;
		io.in("quizmaster." + request.quizinstance).emit("RequestQuestion", request);
	});

	// forward answers to quiz master
	socket.on("QuizAnswer", function(answer) {
		console.log("answer from " + answer.from + " for quiz " + answer.quizinstance);
		io.in("quizmaster." + answer.quizinstance).emit("QuizAnswer", answer);
	});

	// forward correct option to clients
	socket.on("RevealCorrect", function(revealMsg) {
		io.in("clients." + revealMsg.quizinstance).emit("RevealCorrect");
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


