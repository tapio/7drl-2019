function Client(params) {
	this.actor = params.actor || null;
	this.connected = false;
	var protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://';
	var server = params.server || protocol + window.location.hostname + ":10666";
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
			case "join":
				this.actor.id = msg.player.id;
				//this.actor.pos[0] = msg.player.pos[0];
				//this.actor.pos[1] = msg.player.pos[1];
				this.actor.fov = [];
				dungeon.deserialize(msg.data);
				this.actor.updateVisibility();
				this.playing = true;
				break;
			case "state":
				for (var i = 0; i < msg.data.length; ++i) {
					var state = msg.data[i];
					var peer = dungeon.findById(state.id);
					if (!peer) { // New player?
						ui.msg("Player " + state.id + " joined.");
						peer = new Actor(state.pos[0], state.pos[1], {
							id: state.id
						});
						world.addActor(peer);
						//FIXME: Horrible hack, fixme
						if (CONFIG.host && peer.id[0] == "P") {
							var mobs = [];
							for (var i = 0; i< dungeon.actors.length; ++i) {
								var mob = dungeon.actors[i];
								if (mob.ai) {
									mobs.push({ id: mob.id, pos: mob.pos });
								}
							}
							this.send({
								type: "state",
								data: mobs
							});
						}
					} else {
						dungeon.findPath(state.pos[0], state.pos[1], peer);
					}
				}
				dungeon.needsRender = true;
				break;
			case "say":
				var actor = dungeon.findById(msg.id);
				if (actor) {
					var sayMsg = [];
					for (var i = 0; i < msg.say.length; i++) {
						sayMsg.push(TILES[msg.say[i]]);
					}
					actor.sayUnsynced(sayMsg);
				}
				break;
			case "ai":
				var actor = dungeon.findById(msg.id);
				if (actor && actor.ai) {
					actor.ai.changeStateUnsynced(msg.state);
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
			case "open":
				var door = dungeon.getTile(msg.pos[0], msg.pos[1], Dungeon.LAYER_STATIC);
				console.assert(door, "No door to open!");
				if (door) {
					dungeon.setTile(msg.pos[0], msg.pos[1], door.name + "_open", Dungeon.LAYER_STATIC);
					this.actor.updateVisibility();
				}
				break;
			case "item_picked":
				var item = dungeon.getTile(msg.pos[0], msg.pos[1], Dungeon.LAYER_ITEM);
				console.assert(item, "Item already picked up!");
				if (item) {
					dungeon.removeItem(item);
					// TODO: Add to some player's inventory?
				}
				break;
			case "leave":
				dungeon.removeById(msg.id);
				ui.msg("Player " + msg.id + " left.");
				break;
			case "pong":
				this.ping = performance.now() - pingTime;
				break;
		}
	}).bind(this);

	this.socket.onclose = (function() {
		if (pingInterval) window.clearInterval(pingInterval);
		if (this.connected) ui.msg("Connection terminated!");
		else ui.msg("Connection failed!");
		this.connected = false;
		if (this.actor) this.actor.id = null;
	}).bind(this);
}

Client.prototype.sendPosition = function(actor) {
	if (!this.connected) return;

	if (!actor.path.length)
		return;

	this.send({
		type: "move",
		id: actor.id,
		pos: last(actor.path)
	});
};

Client.prototype.sendSay = function(actor) {
	if (!this.connected) return;

	if (!actor.sayMsg)
		return;

	var sayArr = [];
	for (var i = 0; i < actor.sayMsg.length; i++) {
		sayArr.push(actor.sayMsg[i].id);
	}
	this.send({
		type: "say",
		id: actor.id,
		say: sayArr
	});
};

Client.prototype.sendAIState = function(actor) {
	if (!this.connected) return;

	this.send({
		type: "ai",
		id: actor.id,
		state: actor.ai.state
	});
};

Client.prototype.addCmd = function(cmdType, ...params) {
	this.commands.push({
		type: cmdType,
		params: params
	});
};

Client.prototype.sendPendingCommands = function() {
	if (this.commands.length > 0) {
		this.send({
			type: "cmds",
			cmds: this.commands
		});
		this.commands.length = 0;
	}
};
