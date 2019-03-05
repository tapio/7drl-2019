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
			var mob = new Actor(pos[0], pos[1], randElem(dungeon.params.mobs));
			world.addActor(mob);
			this.timeSinceSpawn = 0;
			// TODO: Network sync
		}
	}
};