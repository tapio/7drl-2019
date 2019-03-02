Dungeon.prototype.parseRand = function(rangeOrNumber) {
	if (rangeOrNumber instanceof Array)
		return randInt(rangeOrNumber[0], rangeOrNumber[1]);
	else if (typeof(rangeOrNumber) === "number")
		return rangeOrNumber;
	console.error("Invalid range or number", rangeOrNumber);
	return 0;
};

Dungeon.prototype.initMap = function(w, h) {
	this.width = w;
	this.height = h;
	this.map = new Array(Dungeon.LAYER_COUNT);
	for (var i = 0; i < Dungeon.LAYER_COUNT; ++i)
		this.map[i] = new Array(this.width * this.height);
};

Dungeon.prototype.generateItems = function(amount, choices, freeTiles) {
	for (var i = 0; i < amount; ++i) {
		var item = clone(choices.random());
		item.pos = freeTiles.pop();
		if (!item.pos) throw "Too little floor space for items!";
		this.setTile(item.pos[0], item.pos[1], item, Dungeon.LAYER_ITEM);
	}
};

Dungeon.prototype.generateMobs = function(amount, choices, freeTiles) {
	for (var i = 0; i < amount; ++i) {
		var pos = freeTiles.pop();
		if (!pos) throw "Too little floor space for mobs!";
		var mob = new Actor(pos[0], pos[1], choices.random());
		this.actors.push(mob);
	}
};

Dungeon.prototype.generateStairs = function(pos, tile, mapParams) {
	if (!mapParams)
		return;
	var stairs = clone(tile);
	stairs.entrance = { mapId: mapParams.id, mapParams: mapParams };
	this.setTile(pos[0], pos[1], stairs, Dungeon.LAYER_STATIC);
};


Dungeon.prototype.generateInn = function(params) {
	this.initMap(this.parseRand(params.width), this.parseRand(params.height));
	var freeTiles = [];
	// Basic borders
	var wallLayer = params.wallOnStaticLayer ? Dungeon.LAYER_STATIC : Dungeon.LAYER_BG;
	var gen0 = new ROT.Map.Arena(this.width, this.height);
	gen0.create((function(x, y, wall) {
		//wall = wall || ((x <= 1 || y <= 1 || x >= this.width-2 || y >= this.height-2) && Math.random() < 0.667);
		//wall = wall || ((x <= 2 || y <= 2 || x >= this.width-3 || y >= this.height-3) && Math.random() < 0.333);
		this.setTile(x, y, params.floor.random(), Dungeon.LAYER_BG);
		if (wall)
			this.setTile(x, y, params.wall.random(), wallLayer);
		else
			freeTiles.push([x, y]);
	}).bind(this));
	shuffle(freeTiles);
	this.start = freeTiles.pop();
	this.end = freeTiles.pop();
	return freeTiles;
};
