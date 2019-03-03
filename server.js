#!/usr/bin/env node
var PORT = parseInt(process.env.PORT, 10) || 10666;
var VERBOSITY = parseInt(process.env.VERBOSE, 10) || 1;
var WebSocketServer = require('ws').Server;
var fs = require('fs');

var games = {};
var nextPlayerId = 1;

function createGame(id, data) {
	games[id] = {
		id: id,
		data: data,
		players: {},
		spectators: {},
		numPlayers: 0,
		numSpectators: 0,
	};
}

function Player(socket, id, game) {
	this.socket = socket;
	this.id = id;
	this.game = game;
	this.pos = null;
}

Player.prototype.serialize = function() {
	return { id: this.id, pos: this.pos };
};

Player.prototype.join = function(game) {
	if (!this.id) return; // Id is required
	this.leave(); // Leave if already in game
	// Create game if not present
	if (!games[game])
		createGame(game, null);
	this.game = games[game]; // Cache reference
	this.game.players[this.id] = this; // Join
	this.game.numPlayers++;
	this.pos = [ 2, 3 ]; // FIXME
};

Player.prototype.spectate = function(game) {
	if (!this.id) return; // Id is required
	this.leave(); // Leave if already in game
	// Create game if not present
	if (!games[game])
		createGame(game, null);
	this.game = games[game]; // Cache reference
	this.game.spectators[this.id] = this; // Join
	this.game.numSpectators++;
	this.pos = null;
};

Player.prototype.isSpectator = function() { return !this.pos; }

Player.prototype.leave = function() {
	if (!this.game) return; // Nothing to do if not in game
	if (this.isSpectator()) {
		delete this.game.spectators[this.id]; // Leave the game
		this.game.numSpectators--;
	} else {
		delete this.game.players[this.id]; // Leave the game
		this.game.numPlayers--;
	}
	//if (this.game.numPlayers == 0)
	//	delete games[this.game.id];
	delete this.game; // Remove cached game reference
};

Player.prototype.getGameState = function() {
	if (!this.game) return [];
	var ret = [];
	var players = this.game.players;
	for (var i in players) {
		if (/*i !== this.id &&*/ players[i])
			ret.push(players[i].serialize());
	}
	return { type: "state", data: ret };
};

Player.prototype.broadcast = function(data, metoo) {
	if (!this.game) return;
	var players = this.game.players;
	for (var i in players) {
		if ((i !== this.id || metoo) && players[i])
			players[i].socket.send(JSON.stringify(data));
	}
	var spectators = this.game.spectators;
	for (var i in spectators) {
		if ((i !== this.id || metoo) && spectators[i])
			spectators[i].socket.send(JSON.stringify(data));
	}
};


var server = new WebSocketServer({ port: PORT });
server.on('connection', function(ws) {
	var id = "P" + (nextPlayerId++);
	var pl = new Player(ws, id);

	ws.on('message', function(msg) {
		if (VERBOSITY > 1) console.log("Received: " + msg);
		msg = JSON.parse(msg);
		switch (msg.type) {
			// Create game
			case "create":
				createGame(msg.game, msg.data);
				pl.spectate(msg.game); // Can later join properly
				if (VERBOSITY > 0) console.log(pl.id + " creates game " + msg.game);
				break;
			// Join game
			case "join":
				pl.join(msg.game);
				if (VERBOSITY > 0) console.log(pl.id + " joins game " + msg.game + " (" + pl.game.numPlayers + " players, " + pl.game.numSpectators + " spectators)");
				pl.broadcast({ type: "state", data: [ pl.serialize() ] }); // Inform others
				ws.send(JSON.stringify({ type: "join", player: pl.serialize(), data: pl.game.data })); // Inform newcomer about the id
				ws.send(JSON.stringify(pl.getGameState())); // Inform newcomer about others
				break;
			// Move
			case "move":
				pl.pos = msg.pos;
				pl.broadcast({ type: "state", data: [ pl.serialize() ] }, true);
				break;
			case "ping":
				ws.send('{"type":"pong"}');
				break;
			// Unknown
			default:
				if (VERBOSITY > 0) console.log("Unknown message:", msg);
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
