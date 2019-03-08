var GAMECONFIG = {
	dayDuration: 3*60, // seconds
	spawnInterval: 12
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

	// Load save
	var gamesave = window.localStorage.getItem("GAMESAVE");
	if (gamesave) {
		gamesave = JSON.parse(gamesave);
		for (var i in GAMESAVE) {
			if (gamesave.hasOwnProperty(i))
				GAMESAVE[i] = gamesave[i];
		}
	}
	if (CONFIG.debug)
		GAMESAVE.unlockedLevel = LEVELS.length - 1;
}

Game.prototype.reset = function() {
	this.gold = 0;
	this.reputation = 0;
	this.timeLeft = GAMECONFIG.dayDuration;
	this.timeSinceSpawn = 5; // Spawn sooner the first time
};

Game.prototype.calculateStars = function() {
	var score = game.gold + game.reputation;
	var stars = 0;
	if (score >= 200)
		stars = 3;
	else if (score >= 150)
		stars = 2;
	else if (score >= 100)
		stars = 1;
	return stars;
}

Game.prototype.save = function() {
	window.localStorage.setItem("GAMESAVE", JSON.stringify(GAMESAVE));
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

Game.prototype.removeItem = function removeItem(x, y) {
	world.dungeon.setTile(x, y, null, Dungeon.LAYER_ITEM);
};

Game.prototype.cmd = function(func, ...args) {
	if (ui.client)
		ui.client.addCmd("game", func.name, args)
	func.apply(this, args);
};
