
function Actor(x, y, def) {
	def = def || {};
	this.id = def.id || null;
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
	this.criticalChance = def.criticalChance || 0;
	this.luck = def.luck || 0;
	this.stealth = def.stealth || 0;
	this.thirst = 0;
	this.hunger = 0;
	this.drunkenness = 0;
	this.order = null;
	this.items = [];
	this.maxItems = 1;
	this.ai = !def.ai ? null : {
		type: def.ai,
		target: null
	};
	this.faction = def.ai ? 0 : 1;
	this.loot = def.loot || null;
	this.lootChance = def.lootChance || 0;
	this.stats = {
		turns: 0,
		kills: 0
	};
	this.done = false;
	this.moved = false;
}

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
	//var target = world.dungeon.getTile(x, y);
	//if (!target.walkable) return;
	if (x == this.pos[0] && y == this.pos[1]) {
		this.done = true; // Skip turn
		return true;
	}
	if (!world.dungeon.getPassable(x, y)) return false;
	if (world.dungeon.findPath(x, y, this)) {
		if (this.client)
			this.client.update();
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
		// Check mob
		var mob = world.dungeon.getTile(waypoint[0], waypoint[1], Dungeon.LAYER_ACTOR);
		if (mob) {
			this.path = [];
			if (this.faction != mob.faction) {
				this.interact(mob);
				return true;
			}
			return false;
		}
		// Check items
		var item = world.dungeon.getTile(waypoint[0], waypoint[1], Dungeon.LAYER_ITEM);
		if (checkItems && item && this.path.length === 0) {
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
				var item = clone(TILES[object.container]);
				this.tryPickUp(item);
				return true;
			}
		}
		this.pos[0] = waypoint[0];
		this.pos[1] = waypoint[1];
		this.moved = true;
		// Check for map change
		if (checkMapChange && this.path.length === 0) {
			var tile = world.dungeon.getTile(this.pos[0], this.pos[1]);
			if (tile.entrance && this.path.length === 0) {
				world.changeMap(this, tile.entrance);
			}
		}
		return true;
	}
	return false;
};

Actor.prototype.tryPickUp = function(item) {
	if (this.items.length >= this.maxItems) {
		ui.msg("Can't carry more items.", this);
		return false;
	}
	// TODO: Handle multiplayer
	this.items.push(item);
	ui.msg("Picked up a " + item.name + ".", this);
	ui.snd("pickup", this);
	return true;
};

Actor.prototype.attack = function(target) {
	this.animPos = lerpVec2(this.pos, target.pos, 0.3);
	if (rnd() < this.dexterity) {
		var damage = 1;
		if (rnd() < this.criticalChance)
			damage *= 2;
		target.health -= damage;
		ui.snd("hit", this);
		ui.snd("hit", target);
		if (target.health <= 0) {
			target.health = 0;
			this.stats.kills++;
			ui.msg("You killed " + target.name + "!", this);
			ui.msg(this.name + " kills you!", target, "warn");
			ui.vibrate(300, target);
			if (target.loot && rnd() < target.lootChance + this.luck) {
				var existing = world.dungeon.getTile(target.pos[0], target.pos[1], Dungeon.LAYER_ITEM);
				if (!existing) {
					world.dungeon.setTile(target.pos[0], target.pos[1], target.loot, Dungeon.LAYER_ITEM);
				}
			}
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
	if (target.order) {
		var item = this.items.find(function(elem) { return elem.id == target.order.id; });
		if (item) {
			removeElem(this.items, item);
			target.order = null;
			ui.msg("You give " + item.name + " to " + target.name + ".", this);
			ui.msg(target.name + ": Thanks!", this);
			ui.snd("powerup", this);
		} else {
			ui.msg(target.name + ": Where is my " + target.order.name + "!", this);
		}
		return;
	}
	target.order = randProp(DRINKS);
	ui.msg(target.name + ": I'd like " + target.order.name, this);
};

Actor.prototype.act = function() {
	if (this.health <= 0)
		return true;

	if (this.done) {
		this.done = false;
		return true;
	}

	if (this.ai)
		return this.drunkAI();

	if (this.doPath(true, true)) {
		this.updateVisibility();
		return true;
	}
	return true; // Can't wait in MP
};

Actor.prototype.drunkAI = function() {
	var dx = randInt(-1, 1);
	var dy = randInt(-1, 1);
	var newPos = [ this.pos[0] + dx, this.pos[1] + dy ];
	if (world.dungeon.getPassable(newPos[0], newPos[1])) {
		this.path.push(newPos);
		this.doPath(false, false);
	}
	return true;
};

Actor.prototype.hunterAI = function() {
	if (!this.ai.target) {
		var newTarget = ui.actor; // TODO: Other possibilities?
		this.updateVisibility();
		if (this.visibility(newTarget.pos[0], newTarget.pos[1]) < 1) {
			return this.drunkAI();
		} else if (newTarget.stealth) {
			var d = Math.round(dist(this.pos[0], this.pos[1], newTarget.pos[0], newTarget.pos[1]));
			if (d > Math.max(2, this.vision - newTarget.stealth))
				return this.drunkAI();
		}
		this.ai.target = ui.actor;
	}
	var target = this.ai.target;
	var tx = target.pos[0], ty = target.pos[1];
	this.moveTo(target.pos[0], target.pos[1]);
	this.doPath(false, false);
	return true;
};