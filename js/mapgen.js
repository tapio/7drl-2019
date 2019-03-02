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

Dungeon.prototype.generateDungeon = function(params) {
	this.initMap(this.parseRand(params.width), this.parseRand(params.height));
	var gen = new ROT.Map.Digger(this.width, this.height, {
		roomWidth: params.roomWidth || [5, 6],
		roomHeight: params.roomHeight || [4, 5],
		corridorLength: params.corridorLength || [2, 4],
		dugPercentage: params.dugPercentage || 0.3,
		//roomDugPercentage: 0.5,
		timeLimit: 3000
	});
	// General layout
	gen.create((function(x, y, wall) {
		this.setTile(x, y, wall ? params.wall.random() : params.floor.random());
	}).bind(this));
	var freeTiles = [];
	var keyTiles = [];
	var keysNeeded = 0;
	var rooms = gen.getRooms();
	var doors = [ TILES.door_wood, TILES.door_metal ];
	var doorLockedCallback = (function(x, y) {
		keysNeeded++;
		this.setTile(x, y, TILES.door_metal, Dungeon.LAYER_STATIC);
	}).bind(this);
	var doorCallback = (function(x, y) {
		this.setTile(x, y, TILES.door_wood, Dungeon.LAYER_STATIC);
	}).bind(this);
	this.start = rooms[0].getCenter();
	this.end = rooms[rooms.length-1].getCenter();
	for (var i = 0; i < rooms.length; i++) {
		var numDoors = Object.keys(rooms[i]._doors).length;
		// Lock single door rooms and usually also down stairs room
		var locked = (numDoors === 1 && i !== 0) || (rnd() < 0.5 && i == rooms.length-1);
		if (locked) rooms[i].getDoors(doorLockedCallback);
		else rooms[i].getDoors(doorCallback);
		for (var y = rooms[i].getTop(); y < rooms[i].getBottom(); ++y) {
			for (var x = rooms[i].getLeft(); x < rooms[i].getRight(); ++x) {
				if ((x != this.start[0] || y != this.start[1]) &&
					(x != this.end[0] || y != this.end[1]))
				{
					// Don't generate keays in the first room, because that's boring
					if (locked || i === 0) freeTiles.push([x, y]);
					else if (i !== 0) keyTiles.push([x, y]);
				}
			}
		}
	}
	shuffle(keyTiles);
	this.generateItems(keysNeeded, [TILES.key], keyTiles);
	// TODO: Put some loot inside locked rooms (freeTiles) for reward
	freeTiles = freeTiles.concat(keyTiles);
	shuffle(freeTiles);
	return freeTiles;
};

Dungeon.prototype.generateArena = function(params) {
	this.initMap(this.parseRand(params.width), this.parseRand(params.height));
	var freeTiles = [];
	// Basic borders
	var wallLayer = params.wallOnStaticLayer ? Dungeon.LAYER_STATIC : Dungeon.LAYER_BG;
	var gen0 = new ROT.Map.Arena(this.width, this.height);
	gen0.create((function(x, y, wall) {
		wall = wall || ((x <= 1 || y <= 1 || x >= this.width-2 || y >= this.height-2) && Math.random() < 0.667);
		wall = wall || ((x <= 2 || y <= 2 || x >= this.width-3 || y >= this.height-3) && Math.random() < 0.333);
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

Dungeon.prototype.generateCave = function(params) {
	// Seems there is a chance of large empty space at the bottom if height > width
	var w = this.parseRand(params.width);
	var h = Math.min(this.parseRand(params.height), w - 1);
	this.initMap(w, h);
	var freeTiles = [];
	// Basic borders
	var wallLayer = params.wallOnStaticLayer ? Dungeon.LAYER_STATIC : Dungeon.LAYER_BG;
	var gen0 = new ROT.Map.Arena(this.width, this.height);
	gen0.create((function(x, y, wall) {
		wall = wall || ((x <= 1 || y <= 1 || x >= this.width-2 || y >= this.height-2) && Math.random() < 0.667);
		wall = wall || ((x <= 2 || y <= 2 || x >= this.width-3 || y >= this.height-3) && Math.random() < 0.333);
		this.setTile(x, y, params.floor.random(), Dungeon.LAYER_BG);
		if (wall)
			this.setTile(x, y, params.wall.random(), wallLayer);
	}).bind(this));
	// Cellular middle part
	var offset = 4;
	var numGen = 1;
	var gen = new ROT.Map.Cellular(this.width - offset*2, this.height - offset*2, { connected: true });
	gen.randomize(0.5);
	for (var i = 0; i < numGen; ++i)
		gen.create(null);
	gen.create((function(x, y, wall) {
		x += offset; y += offset;
		if (wall) {
			this.setTile(x, y, params.wall.random());
		} else {
			this.setTile(x, y, params.floor.random());
			freeTiles.push([x, y]);
		}
	}).bind(this));
	shuffle(freeTiles);
	this.start = freeTiles.pop();
	this.end = freeTiles.pop();
	return freeTiles;
};

Dungeon.prototype.generateMaze = function(params) {
	this.initMap(this.parseRand(params.width), this.parseRand(params.height));
	var freeTiles = [];
	// Basic borders
	var wallLayer = params.wallOnStaticLayer ? Dungeon.LAYER_STATIC : Dungeon.LAYER_BG;
	var gen = new ROT.Map.EllerMaze(this.width, this.height);
	gen.create((function(x, y, wall) {
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