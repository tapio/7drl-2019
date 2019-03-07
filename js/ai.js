
var PatronState = {
	Moving: 0,
	WantToOrder: 1,
	WaitingDelivery: 2,
	Content: 3,
	Ill: 4,
	Leaving: 5
};

var TimingLevel = {
	Excellent: 0,
	Satisfactory: 1,
	Poor: 2,
	Crap: 3,
	Unacceptable: 4,
	NumLevels: 5
};

var AICONFIG = {
	ContentTime: 12,
	SatisfactionLeaveThreshold: -2,
	DrunkennessVomitThreshold: 3,
	VomitInterval: 5,
	VomitReputation: -5,
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
	this.intervalTimer = 0;
	this.order = null;
	this.satisfaction = 0;
	this.thirst = 0;
	this.hunger = 0;
	this.drunkenness = 0;
}

AI.prototype.changeState = function(newState) {
	if (CONFIG.host) {
		this.cmd(this.changeStateUnsynced, newState);
	} else this.changeStateUnsynced(newState);
};

AI.prototype.changeStateUnsynced = function(newState) {
	this.state = newState;
	this.stateTime = 0;
	this.intervalTimer = 0;
	this.target = null;
};

AI.prototype.handleSatisfaction = function(config) {
	for (var i = 0; i < config.timing.length; ++i) {
		if (this.stateTime < config.timing[i]) {
			var satisfaction = config.satisfaction[i];
			var gold = config.gold ? config.gold[i] : 0;
			this.cmd(this.addSatisfaction, satisfaction);
			game.cmd(game.addReputation, satisfaction);
			game.cmd(game.addGold, gold);
			return i;
		}
	}
};

AI.prototype.addSatisfaction = function addSatisfaction(amount) {
	this.satisfaction += amount;
};

AI.prototype.addDrunkenness = function addDrunkenness(amount) {
	this.drunkenness += amount;
};

AI.prototype.addThirst = function addThirst(amount) {
	this.thirst += amount;
};

AI.prototype.addHunger = function addHunger(amount) {
	this.hunger += amount;
};

AI.prototype.setOrder = function setOrder(id) {
	if (DRINKS[id])
		this.order = DRINKS[id];
	else if (FOOD[id])
		this.order = FOOD[id];
};

AI.prototype.interactWithMe = function(other) {
	switch (this.state) {
		case PatronState.Moving:
		case PatronState.Leaving: {
			// Skip while moving
			break;
		}
		case PatronState.WantToOrder: {
			var dungeonParams = world.dungeon.params;
			var orderId = this.thirst >= this.hunger ? randElem(dungeonParams.drinks).id : randElem(dungeonParams.food).id;
			this.cmd(this.setOrder, orderId);
			ui.msg(this.actor.name + ": I'd like " + this.order.name, other);
			this.actor.say([ TILES[this.order.id] ]);
			this.handleSatisfaction(AICONFIG.WantToOrder);
			this.changeState(PatronState.WaitingDelivery);
			break;
		}
		case PatronState.WaitingDelivery: {
			if (!this.order) {
				console.log("Oh no, no order!");
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
				if (item.drink) {
					this.cmd(this.addHunger, 0.5);
					this.cmd(this.addThirst, -1);
					this.cmd(this.addDrunkenness, 1);
				} else if (item.food) {
					this.cmd(this.addHunger, -1);
					this.cmd(this.addThirst, 1);
					this.cmd(this.addDrunkenness, -0.25);
				}
				ui.snd("powerup", this.actor);
				this.order = null;
				this.changeState(PatronState.Content);
			} else {
				// Reasking/wrong delivery is not cool
				ui.msg(this.actor.name + ": Where is my " + this.order.name + "!", other);
				this.cmd(this.addSatisfaction, -1);
				game.cmd(game.addReputation, -1);
				this.actor.say([ TILES[this.order.id], TILES.ui_question ]);
			}
			break;
		}
		case PatronState.Content: {
			// TODO: Show some emoji
			break;
		}
		case PatronState.Ill: {
			// Kick out
			this.changeState(PatronState.Leaving);
			break;
		}
	}
};

AI.prototype.act = function() {
	var dt = CONFIG.roundDelay / 1000;
	this.stateTime += dt;
	this.intervalTimer += dt;

	if (!CONFIG.host) {
		if (this.actor.doPath(false, false)) {
			this.actor.updateVisibility();
		}
		return;
	}

	if (this.state != PatronState.Leaving && this.satisfaction < AICONFIG.SatisfactionLeaveThreshold) {
		this.actor.say([ TILES.ui_angry ]);
		this.changeState(PatronState.Leaving);
	}

	switch (this.state) {
		case PatronState.Moving: {
			if (this.stateTime > 4) { // If not reached target in a timely fashion, try again
				this.stateTime = 0;
				this.target = null;
			}
			if (!this.target) {
				var chair = randElem(world.dungeon.chairs);
				if (chair && world.dungeon.getPassable(chair[0], chair[1])) {
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
			if (this.intervalTimer > AICONFIG.WantToOrder.timing[TimingLevel.Satisfactory]) {
				this.actor.say([ TILES.ui_attention ]);
				this.cmd(this.addSatisfaction, -1);
				this.intervalTimer = 0;
			}
			break;
		}
		case PatronState.WaitingDelivery: {
			if (this.intervalTimer > AICONFIG.WaitingDelivery.timing[TimingLevel.Satisfactory]) {
				this.actor.say([ TILES.ui_question ]);
				this.cmd(this.addSatisfaction, -1);
				this.intervalTimer = 0;
			}
			break;
		}
		case PatronState.Content: {
			if (this.stateTime > AICONFIG.ContentTime * 0.5 && this.drunkenness >= AICONFIG.DrunkennessVomitThreshold) {
				this.actor.say([ TILES.ui_ill ]);
				this.changeState(PatronState.Ill);
			} else if (this.stateTime > AICONFIG.ContentTime) {
				this.actor.say([ TILES.ui_attention ]);
				this.changeState(PatronState.WantToOrder);
			}
			break;
		}
		case PatronState.Ill: {
			if (this.intervalTimer > AICONFIG.VomitInterval) {
				this.intervalTimer = 0;
				this.actor.say([ TILES.ui_ill ]);
				this.actor.cmd(this.actor.vomit);
				game.cmd(game.addReputation, AICONFIG.VomitReputation);
			}
			break;
		}
		case PatronState.Leaving: {
			if (!this.target) {
				this.target = world.dungeon.end;
			}
			var target = this.target;
			this.actor.moveTo(target[0], target[1]);
			this.actor.doPath(false, false);
			if (target[0] == this.actor.pos[0] && target[1] == this.actor.pos[1]) {
				this.actor.cmd(this.actor.kill);
			} else if (this.stateTime > 15) { // Fail safe is way is blocked
				this.actor.cmd(this.actor.kill);
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
