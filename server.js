#!/usr/bin/env node
var PORT = parseInt(process.env.PORT, 10) || 10666;
var VERBOSITY = parseInt(process.env.VERBOSE, 10) || 1;
const WebSocket = require('ws');

var fs = require('fs');

var games = {};
var nextPlayerId = 1;

function createGame(id, host, data) {
	games[id] = {
		id: id,
		host: host,
		locked: false,
		data: data,
		players: {},
		numPlayers: 0,
	};
}

function Player(socket, id, game) {
	this.socket = socket;
	this.id = id;
	this.game = game;
}

Player.prototype.join = function(game) {
	if (!this.id) return; // Id is required
	this.leave(); // Leave if already in game
	this.game = games[game]; // Cache reference
	this.game.players[this.id] = this; // Join
	this.game.numPlayers++;
};

Player.prototype.leave = function() {
	if (!this.game) return; // Nothing to do if not in game
	delete this.game.players[this.id]; // Leave the game
	this.game.numPlayers--;
	//if (this.game.numPlayers == 0)
	//	delete games[this.game.id];
	delete this.game; // Remove cached game reference
};

Player.prototype.broadcast = function(data, metoo) {
	if (!this.game) return;
	var serialized = JSON.stringify(data);
	var players = this.game.players;
	for (var i in players) {
		if ((i !== this.id || metoo) && players[i])
			players[i].socket.send(serialized, socketCallback);
	}
};

function socketCallback(err) {
	if (err && VERBOSITY > 0)
		console.log(err.message);
}

var server = new WebSocket.Server({ port: PORT });
server.on('connection', function(ws) {
	var id = "P" + (nextPlayerId++);
	var pl = new Player(ws, id);

	ws.on('message', function(msg) {
		if (VERBOSITY > 1) console.log("Received: " + msg);
		msg = JSON.parse(msg);
		switch (msg.type) {
			// Create game
			case "create":
				createGame(msg.game, pl, msg.data);
				if (VERBOSITY > 0) console.log(pl.id + " creates game " + msg.game);
				pl.join(msg.game);
				break;
			// Join game
			case "join":
				if (!games[msg.game]) {
					ws.send(JSON.stringify({ type: "error", msg: "No game named \"" + msg.game + "\"!" }), socketCallback);
					break;
				}
				if (games[msg.game].locked) {
					ws.send(JSON.stringify({ type: "error", msg: "Game already in progress!" }), socketCallback);
					break;
				}
				pl.join(msg.game);
				if (VERBOSITY > 0) console.log(pl.id + " joins game " + msg.game + " (" + pl.game.numPlayers + " players)");
				ws.send(JSON.stringify({ type: "joined", id: pl.id, data: pl.game.data }), socketCallback); // Inform newcomer about the id
				pl.broadcast({ type: "join", id: pl.id }); // Inform others
				break;
			// Disallow joining
			case "lock":
				if (pl.game) {
					pl.game.locked = true;
					if (VERBOSITY > 0) console.log(pl.id + " locked game " + pl.game.id);
				}
				break;
			case "ping":
				ws.send('{"type":"pong"}', socketCallback);
				break;
			// Unknown, just pass it along
			default:
				// Direct message?
				if (msg.to && pl.game) {
					var toPl = pl.game.players[msg.to];
					delete msg.to;
					if (toPl)
						toPl.socket.send(JSON.stringify(msg), socketCallback);
				} else {
					pl.broadcast(msg, false);
				}
				break;
		}
	});

	ws.on('close', function(msg) {
		if (VERBOSITY > 0) console.log("Disconnected " + (pl.id || "unknown"));
		if (pl.id) pl.broadcast({ type: "leave", id: pl.id });
		pl.leave();
	});
});

console.log("Server running @ ws://localhost:" + PORT);
