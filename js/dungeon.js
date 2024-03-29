
function Dungeon(id, params) {
	//ROT.RNG.setSeed(666);
	this.params = params;
	this.id = id;
	this.width = 0;
	this.height = 0;
	this.actors = [];
	this.chairs = [];
	this.playerFov = [];
	this.map = [];
	this.start = [0, 0];
	this.end = [0, 0];
	this.mobSpawns = [];
	var generators = {
		inn: this.generateInn.bind(this)
	};
	Dungeon.totalCount++;
	var freeTiles = generators[params.generator](params);
	// Items
	this.generateItems(this.parseRand(params.itemAmount), params.items, freeTiles);
	// Mobs
	this.generateMobs(this.parseRand(params.mobAmount), params.mobs, freeTiles);
	// Decor / clutter
	var decorAmount = this.parseRand(params.decorAmount);
	for (var i = 0; i < decorAmount; ++i) {
		var pos = freeTiles.pop();
		if (!pos) {
			console.warn("Too little floor space for decor!");
			break;
		}
		this.setTile(pos[0], pos[1], params.decor.random(), Dungeon.LAYER_STATIC);
	}
	//if (LEVELS[id+1])
	//	this.generateStairs(this.end, TILES.stairs_down, LEVELS[id+1]);
	//else this.generateStairs(this.end, TILES.ring, { id: "WIN" });
	//this.generateStairs(this.start, TILES.stairs_up, LEVELS[id-1]);
	this.needsRender = true;
}

Dungeon.LAYER_BG = 0;
Dungeon.LAYER_STATIC = 1;
Dungeon.LAYER_ITEM = 2;
Dungeon.LAYER_ACTOR = 3;
Dungeon.LAYER_COUNT = 4;
Dungeon.totalCount = 0;

Dungeon.prototype.serialize = function() {
	var layersToSend = Dungeon.LAYER_STATIC + 1;
	var ret = {
		w: this.width,
		h: this.height,
		items: [],
		map: new Array(layersToSend)
	};
	for (var i = 0; i < layersToSend; ++i)
		ret.map[i] = new Array(this.width * this.height);
	for (var i = 0, l = this.width * this.height; i < l; ++i) {
		for (var layer = 0; layer < layersToSend; ++layer) {
			var tile = this.map[layer][i];
			ret.map[layer][i] = tile ? tile.id : 0;
		}
	}
	//for (var i = 0, l = this.items.length; i < l; ++i)
	//	ret.items.push({ id: this.items[i].id, pos: this.items[i].pos });
	return ret;
};

Dungeon.prototype.deserialize = function(data) {
	this.width = data.w;
	this.height = data.h;
	for (var i = 0; i < Dungeon.LAYER_COUNT; ++i)
		this.map[i] = new Array(this.width * this.height);
	for (var i = 0, l = this.width * this.height; i < l; ++i) {
		this.map[Dungeon.LAYER_BG][i] = TILES[data.map[Dungeon.LAYER_BG][i]];
		if (data.map[Dungeon.LAYER_STATIC][i])
			this.map[Dungeon.LAYER_STATIC][i] = TILES[data.map[Dungeon.LAYER_STATIC][i]];
		//if (data.map[Dungeon.LAYER_ITEM][i])
		//	this.map[Dungeon.LAYER_ITEM][i] = TILES[data.map[Dungeon.LAYER_ITEM][i]];
	}
	/*for (var i = 0, l = data.items.length; i < l; ++i) {
		var itemSpec = data.items[i];
		var item = clone(TILES[itemSpec.id]);
		item.pos = itemSpec.pos;
		this.setTile(item.pos[0], item.pos[1], item, Dungeon.LAYER_ITEM);
		this.items.push(item);
	}*/
	this.needsRender = true;
};

Dungeon.prototype.findById = function(id) {
	for (var i = 0, l = this.actors.length; i < l; ++i)
		if (this.actors[i].id == id)
			return this.actors[i];
	return null;
};

Dungeon.prototype.removeById = function(id) {
	for (var i = 0, l = this.actors.length; i < l; ++i)
		if (this.actors[i].id == id)
			return this.actors.splice(i, 1);
};

Dungeon.prototype.removeItem = function(item) {
	removeElem(this.items, item);
	this.setTile(item.pos[0], item.pos[1], null, Dungeon.LAYER_ITEM);
};

Dungeon.prototype.getTile = function(x, y, layer) {
	if (x < 0 || y < 0 || x >= this.width || y >= this.height) return TILES.empty;
	if (layer !== undefined)
		return this.map[layer][x + y * this.width];
	for (layer = Dungeon.LAYER_COUNT - 1; layer >= 0; layer--)
		if (this.map[layer][x + y * this.width])
			return this.map[layer][x + y * this.width];
};

Dungeon.prototype.setTile = function(x, y, tile, layer) {
	if (!layer) layer = Dungeon.LAYER_BG;
	this.map[layer][x + y * this.width] = typeof tile == "string" ? TILES[tile] : tile;
	this.needsRender = true;
};

Dungeon.prototype.getPassable = function(x, y) {
	var staticTile = this.getTile(x, y, Dungeon.LAYER_STATIC);
	if (staticTile && !staticTile.walkable) return false;
	var actorTile = this.getTile(x, y, Dungeon.LAYER_ACTOR);
	if (actorTile) return false;
	return this.getTile(x, y, Dungeon.LAYER_BG).walkable;
};

Dungeon.prototype.getTargetable = function(x, y) {
	var staticTile = this.getTile(x, y, Dungeon.LAYER_STATIC);
	if (staticTile) {
		if (staticTile.interactable) return true;
		if (!staticTile.walkable) return false;
	}
	return this.getTile(x, y, Dungeon.LAYER_BG).walkable;
};

Dungeon.prototype.getTransparent = function(x, y) {
	var staticTile = this.getTile(x, y, Dungeon.LAYER_STATIC);
	if (staticTile && !staticTile.transparent) return false;
	return this.getTile(x, y, Dungeon.LAYER_BG).transparent;
};

Dungeon.prototype.findPath = function(x, y, actor) {
	var actorx = actor.pos[0];
	var actory = actor.pos[1];
	var finder = new ROT.Path.AStar(x, y, (function(testx, testy) {
		if (testx === actorx && testy === actory)
			return true;
		if (testx === x && testy === y)
			return this.getTargetable(testx, testy);
		return this.getPassable(testx, testy);
	}).bind(this));
	var success = false;
	actor.path = [];
	finder.compute(actorx, actory, function(x, y) {
		if (x != actorx || y != actory)
			actor.path.push([x, y]);
		success = true;
	});
	return success;
};

Dungeon.prototype.update = function() {
	for (var i = 0, l = this.map[Dungeon.LAYER_ACTOR].length; i < l; ++i)
		this.map[Dungeon.LAYER_ACTOR][i] = null;
	for (var i = 0, l = this.actors.length; i < l; ++i) {
		var actor = this.actors[i];
		this.map[Dungeon.LAYER_ACTOR][actor.pos[0] + actor.pos[1] * this.width] = actor;
	}
	this.needsRender = true;
};

Dungeon.prototype.animate = function(dt) {
	for (var i = 0, l = this.actors.length; i < l; ++i) {
		var actor = this.actors[i];
		var dx = actor.pos[0] - actor.animPos[0];
		var dy = actor.pos[1] - actor.animPos[1];
		if (dx !== 0 || dy !== 0) {
			if (ui.actor && ui.actor.visibility(actor.pos[0], actor.pos[1]) < 0.9) {
				// Don't bother animating mobs that are not visible
				actor.animPos[0] = actor.pos[0];
				actor.animPos[1] = actor.pos[1];
				continue;
			}
			var duration = actor === ui.actor ? CONFIG.playerMoveDuration : CONFIG.enemyMoveDuration;
			var speed = (1000 / duration) * dt;
			if (Math.abs(dx) <= speed)
				actor.animPos[0] = actor.pos[0];
			else
				actor.animPos[0] += Math.sign(dx) * speed;
			if (Math.abs(dy) <= speed)
				actor.animPos[1] = actor.pos[1];
			else
				actor.animPos[1] += Math.sign(dy) * speed;
			actor.animTime += 1000 * dt;
			var anim = actor.tile.anim;
			if (anim && anim.length && actor.animTime >= CONFIG.animFrameDuration) {
				actor.animFrame = (actor.animFrame + 1) % anim.length;
				actor.animTime = 0;
				actor.tile.tileCoords[0] = anim[actor.animFrame][0];
				actor.tile.tileCoords[1] = anim[actor.animFrame][1];
			}
			this.needsRender = true;
		}
	}
};

Dungeon.prototype.draw = function(camera, display, player) {
	if (!this.needsRender)
		return;
	this.needsRender = false;
	//display.clear();
	display._dirty = false;
	var ctx = display._context;
	ctx.fillStyle = display._options.bg;
	ctx.fillRect(0, 0, display._context.canvas.width, display._context.canvas.height);

	var w = display.getOptions().width;
	var h = display.getOptions().height;
	var tw = display.getOptions().tileWidth;
	var th = display.getOptions().tileHeight;

	function drawTile(x, y, ch) {
		var tileCoords = TILES.tileArray[ch].tileCoords;
		ctx.drawImage(
			display._options.tileSet,
			tileCoords[0], tileCoords[1], tw, th,
			x, y, tw, th
		);
	}

	for (var j = -1; j <= h; ++j) { // Render extra borders for smooth scrolling
		for (var i = -1; i <= w; ++i) {
			var x = i + camera.pos[0];
			var y = j + camera.pos[1];
			var k = x + y * this.width;
			var visibility = player.visibility(x, y);
			if (visibility <= 0)
				continue;
			var visx = Math.round((i + camera.offset[0]) * tw);
			var visy = Math.round((j + camera.offset[1]) * th);
			drawTile(visx, visy, this.map[Dungeon.LAYER_BG][k].ch);
			if (visibility > 0.5 && this.map[Dungeon.LAYER_STATIC][k])
				drawTile(visx, visy, this.map[Dungeon.LAYER_STATIC][k].ch);
			if (visibility > 0.9 && this.map[Dungeon.LAYER_ITEM][k])
				drawTile(visx, visy, this.map[Dungeon.LAYER_ITEM][k].ch);
			if (visibility <= 0.9) {
				ctx.fillStyle = "rgba(0,0,0,0.6)";
				ctx.fillRect(visx, visy, tw, th);
			}
		}
	}
	var sayActors = [];
	for (var i = 0, l = this.actors.length; i < l; ++i) {
		var actor = this.actors[i];
		var visibility = player.visibility(actor.pos[0], actor.pos[1]);
		if (visibility > 0.9) {
			var tileCoords = actor.tile.tileCoords;
			var x = actor.animPos[0] - camera.pos[0] + camera.offset[0];
			var y = actor.animPos[1] - camera.pos[1] + camera.offset[1];
			ctx.drawImage(
				display._options.tileSet,
				tileCoords[0], tileCoords[1], tw, th,
				x * tw, y * th, tw, th
			);
			if (actor.sayMsg)
				sayActors.push(actor);
		}
	}
	// Speech bubbles, rendered separately to render on top of everything
	ctx.fillStyle = "#fff";
	for (var i = 0, l = sayActors.length; i < l; ++i) {
		var actor = sayActors[i];
		var x = actor.animPos[0] - camera.pos[0] + camera.offset[0];
		var y = actor.animPos[1] - camera.pos[1] + camera.offset[1];
		// Speech bubble bg
		var bgImg = IMGS.bubble1.img;
		if (actor.sayMsg.length == 2)
			bgImg = IMGS.bubble2.img;
		else if (actor.sayMsg.length > 2)
			bgImg = IMGS.bubble3.img;
		x = (x + 0.5) * tw;
		y = y * th;
		ctx.drawImage(bgImg, x - bgImg.width * 0.5, y - bgImg.height - 1);
		// "Emojis"
		var count = actor.sayMsg.length;
		x -= count * tw * 0.5;
		y -= th + 6;
		for (var j = 0; j < count; ++j) {
			var tile = actor.sayMsg[j];
			var tileCoords = tile.tileCoords;
			ctx.drawImage(
				display._options.tileSet,
				tileCoords[0], tileCoords[1], tw, th,
				x, y, tw, th
			);
			x += tw;
		}
	}
};
