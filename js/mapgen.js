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
		if (wall) {
			this.setTile(x, y, params.wall.random(), wallLayer);
			return;
		}
		// Bar counter
		if (x == 3 && y > 3 && y < this.height - 4) {
			this.setTile(x, y, params.counter.random(), Dungeon.LAYER_STATIC);
			return;
		}
		// By the wall decor
		if (y == 1 || y == this.height - 2)
			freeTiles.push([x, y]);
	}).bind(this));

	var placeTable = (function(x, y) {
		this.setTile(x-1, y, params.chair[0], Dungeon.LAYER_STATIC);
		this.setTile(x+0, y, params.table.random(), Dungeon.LAYER_STATIC);
		this.setTile(x+1, y, params.chair[1], Dungeon.LAYER_STATIC);
		this.chairs.push([x-1, y]);
		this.chairs.push([x+1, y]);
	}).bind(this);
	for (var y = 4; y < this.height - 3; y += 3)
		for (var x = 6; x < this.width - 3; x += 4)
			placeTable(x, y);

	// Barrels
	var barrelTileCount = params.drinks.length + params.food.length + 1;
	var barrelY = Math.floor(this.height / 2 - barrelTileCount / 2);
	for (var i = 0; i < params.drinks.length; ++i) {
		var drink = params.drinks[i];
		this.setTile(0, barrelY, drink, Dungeon.LAYER_STATIC);
		this.setTile(1, barrelY, TILES["barrel_" + drink.id], Dungeon.LAYER_STATIC);
		barrelY++;
	}
	barrelY++;
	for (var i = 0; i < params.food.length; ++i) {
		var food = params.food[i];
		this.setTile(0, barrelY, food, Dungeon.LAYER_STATIC);
		this.setTile(1, barrelY, TILES["barrel_" + food.id], Dungeon.LAYER_STATIC);
		barrelY++;
	}

	// Door
	var doorx = this.width - 1;
	var doory = Math.floor(this.height / 2)
	this.setTile(doorx, doory, TILES.door_wood, Dungeon.LAYER_STATIC);
	this.mobSpawns.push([doorx, doory]);

	shuffle(freeTiles);
	this.start = [2, 5]; //freeTiles.pop(); // TODO
	this.end = freeTiles.pop();
	return freeTiles;
};
