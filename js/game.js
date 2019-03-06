var GAMECONFIG = {
	dayDuration: 3*60, // seconds
	spawnInterval: 10
};

function Game() {
	"use strict";
	this.gold = 0;
	this.reputation = 0;
	this.timeLeft = 0;
	this.timeSinceSpawn = 0;
	this.reset();

	this.cmdProcessors = {
		actor: function(actorId, funcName, params) {
			var actor = world.dungeon.findById(actorId);
			if (actor) {
				var func = actor[funcName];
				if (func) func.apply(actor, params);
				else console.log("No actor." + funcName);
			} else console.log("No actor " + actorId);
		},
		ai: function(actorId, funcName, params) {
			var actor = world.dungeon.findById(actorId);
			if (actor && actor.ai) {
				var func = actor.ai[funcName];
				if (func) func.apply(actor.ai, params);
				else console.log("No ai." + funcName);
			} else console.log("No ai actor " + actorId);
		},
		game: function(funcName, params) {
			var func = game[funcName];
			if (func) func.apply(game, params);
			else console.log("No game." + funcName);
		}
	};
}

Game.prototype.reset = function() {
	this.gold = 0;
	this.reputation = 0;
	this.timeLeft = GAMECONFIG.dayDuration;
	this.timeSinceSpawn = GAMECONFIG.spawnInterval / 2; // Spawn sooner the first time
};

Game.prototype.update = function(dt) {
	this.timeLeft -= dt;
	if (this.timeLeft <= 0) {
		world.running = false;
		ui.end();
		return;
	}

	if (!CONFIG.host)
		return;

	var dungeon = world.dungeon;

	this.timeSinceSpawn += dt;
	if (this.timeSinceSpawn > GAMECONFIG.spawnInterval && dungeon.actors.length < dungeon.chairs.length) {
		var pos = randElem(dungeon.mobSpawns);
		if (!dungeon.getTile(pos[0], pos[1], Dungeon.LAYER_ACTOR)) {
			var mobDef = randElem(dungeon.params.mobs);
			mobDef.id = "M" + (Actor.nextGeneratedId++);
			this.cmd(this.spawnMob, pos, mobDef);
		}
	}
};

Game.prototype.spawnMob = function spawnMob(pos, def) {
	var mob = new Actor(pos[0], pos[1], def);
	world.addActor(mob);
	this.timeSinceSpawn = 0;
};

Game.prototype.addGold = function addGold(amount) {
	this.gold += amount;
};

Game.prototype.addReputation = function addReputation(amount) {
	this.reputation += amount;
};

Game.prototype.cmd = function(func, ...args) {
	if (ui.client)
		ui.client.addCmd("game", func.name, args)
	func.apply(this, args);
};
