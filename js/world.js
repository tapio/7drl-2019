var debugDisplay; // = new ROT.Display({width: 100, height: 100, fontSize: 6});
//document.body.appendChild(debugDisplay.getContainer());

function World() {
	"use strict";
	this.maps = [ new Dungeon(0, LEVELS[0]) ];
	this.dungeon = this.maps[0];
	this.scheduler = new ROT.Scheduler.Speed();
	this.currentActor = null;
	this.roundTimer = 0;
	this.running = false;
	this.mapChanged = false;

	if (debugDisplay)
		for (var j = 0; j < this.dungeon.height; ++j)
			for (var i = 0; i < this.dungeon.width; ++i)
				if (!this.dungeon.map[i + j * this.dungeon.width].walkable)
					debugDisplay.draw(i, j, "#");
}

World.prototype.resetScheduler = function() {
	this.scheduler.clear();
	for (var i = 0; i < this.dungeon.actors.length; ++i)
		this.scheduler.add(this.dungeon.actors[i], true);
};

World.prototype.start = function() {
	this.dungeon.update();
	this.resetScheduler();
	this.running = true;
};

World.prototype.update = function(dt) {
	if (!this.running)
		return;
	this.dungeon.animate(dt);
	if (Date.now() < this.roundTimer || !this.dungeon.actors.length)
		return;
	if (!this.currentActor)
		this.currentActor = this.scheduler.next();
	while (!this.mapChanged && this.currentActor.act()) {
		this.currentActor.stats.turns++;
		if (this.currentActor.health <= 0) {
			removeElem(this.dungeon.actors, this.currentActor);
			this.scheduler.remove(this.currentActor);
			if (this.currentActor == ui.actor) {
				this.running = false;
				ui.die();
				return;
			}
		}
		this.dungeon.update();
		this.currentActor = this.scheduler.next();
		if (this.currentActor == ui.actor) {
			this.roundTimer = Date.now() + CONFIG.playerRoundDelay;
			this.currentActor.updateVisibility();
			break; // Always wait for next round after player action
		} else if (ui.actor.visibility(this.currentActor.pos[0], this.currentActor.pos[1]) > 0.9 &&
			distSq(this.currentActor.pos[0], this.currentActor.pos[1], ui.actor.pos[0], ui.actor.pos[1]) <
				ui.actor.vision * ui.actor.vision) // Dist check needed because of Monster Mind perk
		{
			this.roundTimer = Date.now() + CONFIG.enemyRoundDelay;
			break;
		}
	}
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
	this.resetScheduler();
	this.mapChanged = true;
	if (entrance.mapParams.desc)
		ui.msg(entrance.mapParams.desc, actor, "feat");
};

// Debug tool
World.prototype.gotoLevel = function(num) {
	this.changeMap(ui.actor, { mapId: num, mapParams: LEVELS[num] });
};
