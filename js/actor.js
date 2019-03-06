
function Actor(x, y, def) {
	def = def || {};
	this.id = def.id || ("A" + (Actor.nextGeneratedId++));
	this.name = def.name || "Player";
	this.desc = def.desc || "Unknown";
	this.pos = [ x || 0, y || 0 ];
	this.animPos = [ this.pos[0], this.pos[1] ];
	this.animTime = (rnd() * 200)|0;
	this.animFrame = 0;
	this.tile = def.ch ? clone(TILES.tileArray[def.ch]) : clone(TILES.player_female);
	this.path = [];
	this.fov = [];
	this.vision = def.vision || 8;
	this.speed = def.speed || 1;
	this.health = def.health || 3;
	this.maxHealth = this.health;
	this.dexterity = def.dexterity || 0.5;
	this.items = [];
	this.maxItems = 1;
	this.ai = !def.ai ? null : new AI(this);
	this.sayMsg = null;
	this.sayTimeout = 0;
	this.faction = def.ai ? 0 : 1;
	this.stats = {
		turns: 0,
		kills: 0
	};
	this.done = false;
	this.moved = false;
}

Actor.nextGeneratedId = 1;

// Getter needed for ROT.Scheduler.Speed
Actor.prototype.getSpeed = function() {
	return this.speed;
};

Actor.prototype.visibility = function(x, y) {
	var dungeon = world.dungeon;
	if (x < 0 || y < 0 || x >= dungeon.width || y >= dungeon.height)
		return false;
	return true;
	//return this.fov[x + y * world.dungeon.width];
};

Actor.prototype.updateVisibility = function() {
	/*if (this.fov.length != world.dungeon.map[0].length)
		this.fov = new Array(world.dungeon.width * world.dungeon.height);
	for (var i = 0, l = this.fov.length; i < l; ++i)
		if (this.fov[i] == 1) this.fov[i] = 0.5;
		else if (this.fov[i] === undefined) this.fov[i] = 0;
	function callback(x, y, r, visibility) {
		if (x < 0 || y < 0 || x >= world.dungeon.width || y >= world.dungeon.height)
			return;
		if (visibility > 0)
			this.fov[x + y * world.dungeon.width] = 1;
	}
	var fov = new ROT.FOV.PreciseShadowcasting(world.dungeon.getTransparent.bind(world.dungeon));
	fov.compute(this.pos[0], this.pos[1], this.vision, callback.bind(this));*/
};

Actor.prototype.moveTo = function(x, y) {
	if (x == this.pos[0] && y == this.pos[1]) {
		this.done = true; // Skip turn
		return true;
	}
	if (!world.dungeon.getTargetable(x, y)) return false;
	if (world.dungeon.findPath(x, y, this)) {
		if (ui.client && (this == ui.actor || (CONFIG.host && !!this.ai)))
			ui.client.sendPosition(this);
		return true;
	}
	return false;
};

Actor.prototype.move = function(dx, dy) {
	this.moveTo(this.pos[0] + dx, this.pos[1] + dy);
};

Actor.prototype.doPath = function(checkItems, checkMapChange) {
	if (this.path.length) {
		this.moved = false;
		// Pathing
		var waypoint = this.path.shift();
		var atDestination = this.path.length === 0;
		// Check mob
		var mob = world.dungeon.getTile(waypoint[0], waypoint[1], Dungeon.LAYER_ACTOR);
		if (mob) {
			this.path = [];
			if (this.faction != mob.faction && atDestination) {
				this.interact(mob);
				return true;
			}
			return false;
		}
		// Check items
		var item = world.dungeon.getTile(waypoint[0], waypoint[1], Dungeon.LAYER_ITEM);
		if (checkItems && item && atDestination) {
			this.animPos = lerpVec2(this.pos, waypoint, 0.2);
			if (this.tryPickUp(item)) {
				world.dungeon.setTile(waypoint[0], waypoint[1], null, Dungeon.LAYER_ITEM);
			}
			return true;
		}
		var object = world.dungeon.getTile(waypoint[0], waypoint[1], Dungeon.LAYER_STATIC);
		if (object) {
			if (object.id == "door_wood") {
				world.dungeon.setTile(waypoint[0], waypoint[1], "door_wood_open", Dungeon.LAYER_STATIC);
				ui.snd("door_open", this);
			} else if (object.id == "door_metal") {
				world.dungeon.setTile(waypoint[0], waypoint[1], "door_metal_open", Dungeon.LAYER_STATIC);
				ui.snd("door_open", this);
			} else if (object.container) {
				if (atDestination) {
					var item = clone(TILES[object.container]);
					this.tryPickUp(item);
				}
				return true;
			}
		}
		this.pos[0] = waypoint[0];
		this.pos[1] = waypoint[1];
		this.moved = true;
		// Check for map change
		if (checkMapChange && atDestination) {
			var tile = world.dungeon.getTile(this.pos[0], this.pos[1]);
			if (tile.entrance) {
				world.changeMap(this, tile.entrance);
			}
		}
		return true;
	}
	return false;
};

Actor.prototype.tryPickUp = function(item) {
	if (this.items.length >= this.maxItems) {
		ui.msg("Can't carry more items, dropping " + this.items[0].name + ".", this);
		this.items[0] = item;
	} else {
		this.items.push(item);
	}
	// TODO: Handle multiplayer
	this.say([ TILES.ui_plus, TILES[item.id] ]);
	ui.msg("Picked up a " + item.name + ".", this);
	ui.snd("pickup", this);
	return true;
};

Actor.prototype.attack = function(target) {
	this.animPos = lerpVec2(this.pos, target.pos, 0.3);
	if (rnd() < this.dexterity) {
		var damage = 1;
		target.health -= damage;
		ui.snd("hit", this);
		ui.snd("hit", target);
		if (target.health <= 0) {
			target.health = 0;
			this.stats.kills++;
			ui.msg("You killed " + target.name + "!", this);
			ui.msg(this.name + " kills you!", target, "warn");
			ui.vibrate(300, target);
		} else {
			ui.msg("You hit " + target.name + " for " + damage + "!", this);
			ui.msg(this.name + " hits you for " + damage + "!", target, "warn");
			ui.vibrate(75, target);
		}
	} else {
		ui.msg("You missed " + target.name + "!", this);
		ui.msg(this.name + " missed you!", target);
		ui.snd("miss", this);
		ui.snd("miss", target);
	}
};

Actor.prototype.interact = function(target) {
	this.animPos = lerpVec2(this.pos, target.pos, 0.3);
	if (target.ai) {
		target.ai.interactWithMe(this);
	}
};

Actor.prototype.say = function(msg) {
	this.cmd(this.sayDeserialize, msg.map(x => x.id));
};

Actor.prototype.sayDeserialize = function sayDeserialize(msg) {
	this.sayMsg = msg.map(x => TILES[x]);
	this.sayTimeout = CONFIG.sayDuration;
	world.dungeon.needsRender = true;
};

Actor.prototype.act = function() {
	if (this.health <= 0)
		return true;

	if (this.sayMsg) {
		this.sayTimeout -= CONFIG.roundDelay;
		if (this.sayTimeout <= 0) {
			this.sayMsg = null;
		}
	}

	if (this.done) {
		this.done = false;
		return true;
	}

	if (this.ai)
		return this.ai.act();

	if (this.doPath(true, true)) {
		this.updateVisibility();
		return true;
	}
	return true; // Can't wait in MP
};

Actor.prototype.cmd = function(func, ...args) {
	if (ui.client)
		ui.client.addCmd("actor", this.id, func.name, args)
	func.apply(this, args);
};
