function Client(params) {
	this.actor = params.actor || null;
	this.connected = false;
	var protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://';
	var server = params.server || protocol + window.location.hostname + ":10666";
	ui.msg("Connecting to " + server + "...");
	this.socket = new WebSocket(server);
	this.ping = Infinity;
	this.game = params.game || "testgame";
	var pingTime = 0;
	var pingInterval = null;

	this.send = function(msg) {
		this.socket.send(JSON.stringify(msg));
	};

	this.socket.onopen = (function() {
		ui.msg("Connection established!");
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
						peer = new Actor();
						peer.id = state.id;
						peer.pos[0] = state.pos[0];
						peer.pos[1] = state.pos[1];
						world.addActor(peer);
					} else {
						dungeon.findPath(state.pos[0], state.pos[1], peer);
					}
				}
				dungeon.needsRender = true;
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
};

Client.prototype.update = function() {
	if (!this.connected || !this.actor.id) return;

	if (!this.actor.path.length)
		return;

	var packet = {
		type: "move",
		id: this.id,
		pos: last(this.actor.path)
	};
	this.send(packet);
};
