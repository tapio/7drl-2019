
var PatronState = {
	Moving: 0,
	WantToOrder: 1,
	WaitingDelivery: 2,
	Content: 3
};

var TimingLevel = {
	Excellent: 0,
	Satisfactory: 1,
	Poor: 2,
	Crap: 3,
	Unacceptable: 4,
	NumLevels : 5
};

var AICONFIG = {
	ContentTime: 5,
	WantToOrder: {
		timing: [ 1, 8, 12, 18, 999999 ],
		satisfaction: [ 1, 0, -1, -2, -3 ]
	},
	WaitingDelivery: {
		timing: [ 5, 10, 15, 20, 999999 ],
		satisfaction: [ 5, 2, -2, -4, -6 ],
		gold: [ 1, 1, 1, 1, 1 ]
	},
	emotes: [
		[ TILES.ui_love ],
		[ TILES.ui_thanks ],
		[ TILES.ui_disappointed ],
		[ TILES.ui_angry ],
		[ TILES.ui_angry ]
	]
};

function AI(actor) {
	this.actor = actor;
	this.target = null;
	this.state = PatronState.Moving;
	this.stateTime = 0;
	this.order = null;
	this.satisfaction = 0;
	this.thirst = 0;
	this.hunger = 0;
	this.drunkenness = 0;
}

AI.prototype.changeState = function(newState) {
	this.changeStateUnsynced(newState);
	if (CONFIG.host && ui.client) {
		ui.client.sendAIState(this.actor);
	}
};

AI.prototype.changeStateUnsynced = function(newState) {
	this.state = newState;
	this.stateTime = 0;
};

AI.prototype.handleSatisfaction = function(config) {
	for (var i = 0; i < config.timing.length; ++i) {
		if (this.stateTime < config.timing[i]) {
			var satisfaction = config.satisfaction[i];
			var gold = config.gold ? config.gold[i] : 0;
			this.satisfaction += satisfaction;
			game.reputation += satisfaction;
			game.gold += gold;
			if (ui.client) {
				ui.client.sendGameStateUpdate({reputation: satisfaction, gold: gold});
			}
			return i;
		}
	}
};

AI.prototype.interactWithMe = function(other) {
	switch (this.state) {
		case PatronState.Moving: {
			// Skip while moving
			break;
		}
		case PatronState.WantToOrder: {
			this.order = randProp(DRINKS);
			ui.msg(this.actor.name + ": I'd like " + this.order.name, other);
			this.actor.say([ TILES[this.order.id] ]);
			this.handleSatisfaction(AICONFIG.WantToOrder);
			this.changeState(PatronState.WaitingDelivery);
			break;
		}
		case PatronState.WaitingDelivery: {
			if (!this.order) {
				console.log("TODO: No order sycing yet!");
				break;
			}
			var orderId = this.order.id;
			var item = other.items.find(function(elem) { return elem.id == orderId; });
			if (item) {
				removeElem(other.items, item);
				ui.msg("You give " + item.name + " to " + this.actor.name + ".", other);
				ui.msg(this.actor.name + ": Thanks!", other);
				var satisfactionLevel = this.handleSatisfaction(AICONFIG.WaitingDelivery);
				this.actor.say(AICONFIG.emotes[satisfactionLevel]);
				this.drunkenness++;
				ui.snd("powerup", this.actor);
				this.order = null;
				this.changeState(PatronState.Content);
			} else {
				// Reasking/wrong delivery is not cool
				ui.msg(this.actor.name + ": Where is my " + this.order.name + "!", other);
				this.satisfaction--;
				game.reputation--;
				this.actor.say([ TILES[this.order.id], TILES.ui_question ]);
			}
			break;
		}
		case PatronState.Content: {
			// TODO: Show some emoji
			break;
		}
	}
};

AI.prototype.act = function() {
	this.stateTime += CONFIG.roundDelay / 1000;

	if (!CONFIG.host) {
		if (this.actor.doPath(false, false)) {
			this.actor.updateVisibility();
		}
		return;
	}

	switch (this.state) {
		case PatronState.Moving: {
			if (this.stateTime > 5) { // If not reached target in a timely fashion, try again
				this.stateTime = 0;
				this.target = 0;
			}
			if (!this.target) {
				var chair = randElem(world.dungeon.chairs);
				if (chair) {
					this.target = chair;
				} else {
					return this.drunkAI();
				}
			}
			var target = this.target;
			this.actor.moveTo(target[0], target[1]);
			this.actor.doPath(false, false);
			if (target[0] == this.actor.pos[0] && target[1] == this.actor.pos[1]) {
				this.changeState(PatronState.WantToOrder);
			}
			break;
		}
		case PatronState.WantToOrder: {
			// TODO: Show emote if it takes long
			break;
		}
		case PatronState.WaitingDelivery: {
			// TODO: Show emote if it takes long
			break;
		}
		case PatronState.Content: {
			if (this.stateTime > AICONFIG.ContentTime) {
				this.actor.say([ TILES.ui_attention ]);
				this.changeState(PatronState.WantToOrder);
			}
			break;
		}
	}
};

AI.prototype.drunkAI = function() {
	var dx = randInt(-1, 1);
	var dy = randInt(-1, 1);
	var newPos = [ this.actor.pos[0] + dx, this.actor.pos[1] + dy ];
	if (world.dungeon.getPassable(newPos[0], newPos[1])) {
		this.actor.path.push(newPos);
		this.actor.doPath(false, false);
	}
	return true;
};

AI.prototype.cmd = function(func, ...args) {
	if (ui.client)
		ui.client.addCmd("ai", this.actor.id, func.name, args)
	func.apply(this, args);
};
