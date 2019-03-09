function Client(params) {
	this.actor = params.actor || null;
	this.connected = false;
	var protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://';
	var server = params.server ? protocol + params.server : (protocol + window.location.hostname + ":10666");
	ui.msg("Connecting to " + server + "...");
	this.socket = new WebSocket(server);
	this.ping = Infinity;
	this.game = params.game || "testgame";
	this.commands = [];
	var pingTime = 0;
	var pingInterval = null;

	this.send = function(msg) {
		this.socket.send(JSON.stringify(msg));
	};

	this.socket.onopen = (function() {
		ui.msg("Connection established!");
		ui.msg("Game id: " + this.game);
		if (params.host) {
			this.send({ type: "create", game: this.game, data: world.dungeon.serialize() });
		}
		if (params.join) {
			this.send({ type: "join", game: this.game });
		}
		this.connected = true;
		pingInterval = window.setInterval((function() {
			pingTime = performance.now();
			this.send({ type: "ping" });
		}).bind(this), 3500);
	}).bind(this);

	this.socket.onmessage = (function(event) {
		//console.log("Received: " + event.data);
		var dungeon = world.dungeon;
		var msg = JSON.parse(event.data);
		switch (msg.type) {
			case "joined":
				this.actor.id = msg.id;
				dungeon.deserialize(msg.data);
				if (this.actor) {
					this.actor.fov = [];
					this.actor.updateVisibility();
				}
				this.send({
					type: "newplayer",
					id: this.actor.id,
					pos: this.actor.pos,
					params: this.actor.getCreateParams()
				});
				break;
			case "join":
				ui.msg("Player " + msg.id + " joined.");
				if (this.actor) {
					this.send({
						type: "newplayer",
						to: msg.id,
						id: this.actor.id,
						pos: this.actor.pos,
						params: this.actor.getCreateParams()
					});
				}
				break;
			case "newplayer":
				var peer = dungeon.findById(msg.id);
				if (!peer) { // New player?
					ui.msg("Player " + msg.id + " created.");
					peer = new Actor(msg.pos[0], msg.pos[1], msg.params);
					peer.id = msg.id;
					world.addActor(peer);
				} else {
					console.log("Player " + peer.id + " already exists");
				}
				break;
			case "cmds":
				var cmds = msg.cmds;
				for (var i = 0; i < cmds.length; i++) {
					var cmdData = cmds[i];
					var cmdProcessor = game.cmdProcessors[cmdData.type];
					if (cmdProcessor) {
						cmdProcessor.apply(null, cmdData.params);
					} else console.log("No command processor for " , cmdData.type);
				}
				break;
			case "leave":
				dungeon.removeById(msg.id);
				ui.msg("Player " + msg.id + " left.");
				break;
			case "pong":
				this.ping = performance.now() - pingTime;
				break;
			case "error":
				ui.msg("Server error: " + msg.msg);
				ui.showNetworkError(msg.msg);
				break;
		}
	}).bind(this);

	this.socket.onclose = (function() {
		if (pingInterval) window.clearInterval(pingInterval);
		if (this.connected) msg = "Connection terminated!";
		else msg = "Connection failed!";
		ui.msg(msg);
		this.connected = false;
		if (this.actor) this.actor.id = null;
		ui.showNetworkError(msg);
	}).bind(this);
}

Client.prototype.lock = function() {
	if (this.connected)
		this.send({ type: "lock" });
};

Client.prototype.addCmd = function(cmdType, ...params) {
	this.commands.push({
		type: cmdType,
		params: params
	});
};

Client.prototype.sendPendingCommands = function() {
	if (this.connected && this.commands.length > 0) {
		this.send({
			type: "cmds",
			cmds: this.commands
		});
		this.commands.length = 0;
	}
};
