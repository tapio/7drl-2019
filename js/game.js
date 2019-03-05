function Game() {
	"use strict";
	this.gold = 0;
	this.reputation = 0;
	this.timeLeft = CONFIG.dayDuration;
}

Game.prototype.reset = function() {
	this.gold = 0;
	this.reputation = 0;
	this.timeLeft = CONFIG.dayDuration;
};

Game.prototype.update = function(dt) {
	this.timeLeft -= dt;
	if (this.timeLeft <= 0) {
		world.running = false;
		ui.end();
		return;
	}

};