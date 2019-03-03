var debugDisplay; // = new ROT.Display({width: 100, height: 100, fontSize: 6});
//document.body.appendChild(debugDisplay.getContainer());

function World() {
	"use strict";
	this.maps = [ new Dungeon(0, LEVELS[0]) ];
	this.dungeon = this.maps[0];
	this.roundTimer = 0;
	this.running = false;
	this.mapChanged = false;

	if (debugDisplay)
		for (var j = 0; j < this.dungeon.height; ++j)
			for (var i = 0; i < this.dungeon.width; ++i)
				if (!this.dungeon.map[i + j * this.dungeon.width].walkable)
					debugDisplay.draw(i, j, "#");
}

World.prototype.addActor = function(actor) {
	this.dungeon.actors.push(actor);
	this.dungeon.update();
	this.running = true;
};

World.prototype.start = function() {
	this.dungeon.update();
	this.running = true;
};

World.prototype.update = function(dt) {
	if (!this.running)
		return;
	this.dungeon.animate(dt);
	if (Date.now() < this.roundTimer || !this.dungeon.actors.length)
		return;
	var actors = this.dungeon.actors;
	for (var i = 0, l = actors.length; i < l; i++) {
		var currentActor = actors[i];
		currentActor.stats.turns++;
		if (currentActor.health <= 0)
			continue;
		currentActor.act();
		this.dungeon.update();
		if (this.mapChanged)
			break;
	}
	// Reap the dead
	this.dungeon.actors = actors.filter(function(elem) { return elem.health > 0; });
	// Check player death
	if (ui.actor && ui.actor.health <= 0) {
		this.running = false;
		ui.die();
		return;
	}

	this.roundTimer = Date.now() + CONFIG.playerRoundDelay;
	this.mapChanged = false;
};

World.prototype.changeMap = function(actor, entrance) {
	if (entrance.mapId == "WIN") {
		ui.win();
		return;
	}
	removeElem(this.dungeon.actors, actor);
	this.dungeon.start = clone(actor.pos);
	this.dungeon.playerFov = actor.fov;
	if (!this.maps[entrance.mapId]) {
		this.maps[entrance.mapId] = new Dungeon(entrance.mapId, entrance.mapParams);
		ui.msg("Entering new area...", actor);
	} else ui.msg("Entering old area...", actor);
	this.dungeon = this.maps[entrance.mapId];
	this.dungeon.actors.push(actor);
	actor.pos[0] = this.dungeon.start[0];
	actor.pos[1] = this.dungeon.start[1];
	actor.animPos[0] = actor.pos[0];
	actor.animPos[1] = actor.pos[1];
	actor.fov = this.dungeon.playerFov;
	actor.updateVisibility();
	//if (this.dungeon.mobProtos.length && this.dungeon.actors.length < 5) {
	//	this.dungeon.spawnMobs(randInt(4, 7));
	//}
	this.mapChanged = true;
	if (entrance.mapParams.desc)
		ui.msg(entrance.mapParams.desc, actor, "feat");
};

// Debug tool
World.prototype.gotoLevel = function(num) {
	this.changeMap(ui.actor, { mapId: num, mapParams: LEVELS[num] });
};
