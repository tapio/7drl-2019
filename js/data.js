var CONFIG = {
	tileSize: 16,
	tileGap: 0,
	debug: false,
	roundDelay: 140,
	playerMoveDuration: 130,
	enemyMoveDuration: 130,
	animFrameDuration: 64,
	sayDuration: 2000,
	host: true,
	server: typeof window === "undefined",
	touch: typeof navigator !== "undefined" && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
};

// User settings, saved to localStorage
var SETTINGS = {
	sounds: true,
	vibration: true,
	tileMag: 2
};

// Also saved to localStorage
var GAMESAVE = {
	unlockedLevel: 0
};

var TILES = {
	empty: {
		tileCoords: [ 0, 23 ], walkable: false, transparent: false,
		desc: "Nothing"
	},
	grass_plain: {
		tileCoords: [ 0, 0 ], walkable: true, transparent: true,
		desc: "Grass"
	},
	grass_little: {
		tileCoords: [ 1, 0 ], walkable: true, transparent: true,
		desc: "Grass"
	},
	grass_lots: {
		tileCoords: [ 2, 0 ], walkable: true, transparent: true,
		desc: "Grass"
	},
	grass_dark: {
		tileCoords: [ 7, 0 ], walkable: true, transparent: true,
		desc: "Grass"
	},
	grass_darker: {
		tileCoords: [ 6, 0 ], walkable: true, transparent: true,
		desc: "Grass"
	},
	floor_wood: {
		tileCoords: [ 0, 1 ], walkable: true, transparent: true,
		desc: "Wooden floor"
	},
	floor_wood2: {
		tileCoords: [ 1, 1 ], walkable: true, transparent: true,
		desc: "Wooden floor"
	},
	floor_dirt_dunes: {
		tileCoords: [ 5, 7 ], walkable: true, transparent: true,
		desc: "Dirt"
	},
	floor_dirt_a: {
		tileCoords: [ 23, 13 ], walkable: true, transparent: true,
		desc: "Dirt"
	},
	floor_dirt_b: {
		tileCoords: [ 24, 13 ], walkable: true, transparent: true,
		desc: "Dirt"
	},
	floor_dirt_c: {
		tileCoords: [ 23, 14 ], walkable: true, transparent: true,
		desc: "Dirt"
	},
	floor_dirt_d: {
		tileCoords: [ 24, 14 ], walkable: true, transparent: true,
		desc: "Dirt"
	},
	floor_sand_a: {
		tileCoords: [ 0, 3 ], walkable: true, transparent: true,
		desc: "Sand"
	},
	floor_sand_b: {
		tileCoords: [ 1, 3 ], walkable: true, transparent: true,
		desc: "Sand"
	},
	floor_sand_c: {
		tileCoords: [ 2, 3 ], walkable: true, transparent: true,
		desc: "Sand"
	},
	floor_sand_d: {
		tileCoords: [ 3, 3 ], walkable: true, transparent: true,
		desc: "Sand"
	},
	floor_sand_rock1: {
		tileCoords: [ 4, 3 ], walkable: true, transparent: true,
		desc: "Sand"
	},
	floor_sand_rock2: {
		tileCoords: [ 5, 3 ], walkable: true, transparent: true,
		desc: "Sand"
	},
	floor_sand_rock3: {
		tileCoords: [ 6, 3 ], walkable: true, transparent: true,
		desc: "Sand"
	},
	floor_sand_rock4: {
		tileCoords: [ 7, 3 ], walkable: true, transparent: true,
		desc: "Sand"
	},
	floor_sand_alt: {
		tileCoords: [ 0, 2 ], walkable: true, transparent: true,
		desc: "Sand"
	},
	floor_sand_dunes: {
		tileCoords: [ 1, 2 ], walkable: true, transparent: true,
		desc: "Sand"
	},
	floor_tiles: {
		tileCoords: [ 3, 1 ], walkable: true, transparent: true,
		desc: "Floor tiling"
	},
	floor_cobblestone: {
		tileCoords: [ 0, 6 ], walkable: true, transparent: true,
		desc: "Cobblestone"
	},
	floor_cobblestone2: {
		tileCoords: [ 1, 6 ], walkable: true, transparent: true,
		desc: "Cobblestone"
	},
	floor_marble_a: {
		tileCoords: [ 6, 7 ], walkable: true, transparent: true,
		desc: "Marble floor"
	},
	floor_marble_b: {
		tileCoords: [ 7, 7 ], walkable: true, transparent: true,
		desc: "Marble floor"
	},
	floor_marble_c: {
		tileCoords: [ 6, 8 ], walkable: true, transparent: true,
		desc: "Marble floor"
	},
	floor_marble_d: {
		tileCoords: [ 7, 8 ], walkable: true, transparent: true,
		desc: "Marble floor"
	},
	wall_stone: {
		tileCoords: [ 2, 5 ], walkable: false, transparent: false,
		desc: "Stone wall"
	},
	wall_stone2: {
		tileCoords: [ 7, 5 ], walkable: false, transparent: false,
		desc: "Stone wall"
	},
	wall_stone_blue1: {
		tileCoords: [ 3, 6 ], walkable: false, transparent: false,
		desc: "Stone wall"
	},
	wall_stone_blue2: {
		tileCoords: [ 4, 6 ], walkable: false, transparent: false,
		desc: "Stone wall"
	},
	wall_stone_classy: {
		tileCoords: [ 6, 6 ], walkable: false, transparent: false,
		desc: "Stone wall"
	},
	wall_stone_old: {
		tileCoords: [ 1, 4 ], walkable: false, transparent: false,
		desc: "Old stone wall"
	},
	wall_stone_old_small: {
		tileCoords: [ 0, 4 ], walkable: false, transparent: false,
		desc: "Old stone wall"
	},
	wall_bricks: {
		tileCoords: [ 1, 5 ], walkable: false, transparent: false,
		desc: "Brick wall"
	},
	wall_mossy: {
		tileCoords: [ 0, 5 ], walkable: false, transparent: false,
		desc: "Mossy stone wall"
	},
	wall_rocks: {
		tileCoords: [ 3, 5 ], walkable: false, transparent: false,
		desc: "Rocky wall"
	},
	wall_rocks2: {
		tileCoords: [ 4, 5 ], walkable: false, transparent: false,
		desc: "Rocky wall"
	},
	wall_rocks3: {
		tileCoords: [ 5, 5 ], walkable: false, transparent: false,
		desc: "Rocky wall"
	},
	wall_logs: {
		tileCoords: [ 7, 4 ], walkable: false, transparent: false,
		desc: "Log wall"
	},
	wall_logs_thin: {
		tileCoords: [ 6, 4 ], walkable: false, transparent: false,
		desc: "Log wall"
	},

	door_wood: {
		tileCoords: [ 8, 0 ], walkable: true, transparent: false,
		desc: "Closed wooden door, can be opened"
	},
	door_wood_open: {
		tileCoords: [ 8, 2 ], walkable: true, transparent: true,
		desc: "Open wooden door"
	},
	door_metal: {
		tileCoords: [ 9, 0 ], walkable: true, transparent: false,
		desc: "Locked metal door"
	},
	door_metal_open: {
		tileCoords: [ 9, 2 ], walkable: true, transparent: true,
		desc: "Open metal door"
	},
	stairs_down: {
		tileCoords: [ 10, 1 ], walkable: true, transparent: true,
		desc: "Stairs leading to a deeper level"
	},
	stairs_up: {
		tileCoords: [ 10, 0 ], walkable: true, transparent: true,
		desc: "Stairs leading upwards"
	},

	pot: {
		tileCoords: [ 12, 0 ], walkable: true, transparent: true,
		desc: "Clay pot"
	},
	pot_damaged: {
		tileCoords: [ 12, 1 ], walkable: true, transparent: true,
		desc: "Clay pot"
	},
	pot_broken: {
		tileCoords: [ 12, 3 ], walkable: true, transparent: true,
		desc: "Clay pot remains"
	},
	chest: {
		tileCoords: [ 11, 0 ], walkable: true, transparent: true,
		desc: "Chest"
	},
	chest_open: {
		tileCoords: [ 11, 2 ], walkable: true, transparent: true,
		desc: "Open chest"
	},

	flowers: {
		tileCoords: [ 3, 0 ], walkable: true, transparent: true,
		desc: "Some nice flowers"
	},
	bush: {
		tileCoords: [ 19, 0 ], walkable: true, transparent: true,
		desc: "Bush"
	},
	tree: {
		tileCoords: [ 19, 1 ], walkable: false, transparent: true,
		desc: "Tree"
	},
	tree2: {
		tileCoords: [ 19, 2 ], walkable: false, transparent: true,
		desc: "Tree"
	},
	tree3: {
		tileCoords: [ 19, 3 ], walkable: false, transparent: true,
		desc: "Tree"
	},
	rocks: {
		tileCoords: [ 19, 5 ], walkable: false, transparent: true,
		desc: "Rocks"
	},
	well: {
		tileCoords: [ 16, 0 ], walkable: false, transparent: true,
		desc: "Well, probably dry"
	},
	pillar: {
		tileCoords: [ 16, 1 ], walkable: false, transparent: true,
		desc: "Pillar"
	},
	statue: {
		tileCoords: [ 16, 2 ], walkable: false, transparent: true,
		desc: "Cool statue"
	},
	cupboard: {
		tileCoords: [ 16, 3 ], walkable: false, transparent: true,
		desc: "Cupboard"
	},
	counter: {
		tileCoords: [ 14, 1 ], walkable: false, transparent: true,
		desc: "Table"
	},
	table_worn: {
		tileCoords: [ 16, 13 ], walkable: false, transparent: true,
		desc: "Table"
	},
	chair_worn_left: {
		tileCoords: [ 15, 13 ], walkable: true, transparent: true,
		desc: "Chair"
	},
	chair_worn_right: {
		tileCoords: [ 17, 13 ], walkable: true, transparent: true,
		desc: "Chair"
	},
	table: {
		tileCoords: [ 16, 14 ], walkable: false, transparent: true,
		desc: "Table"
	},
	chair_left: {
		tileCoords: [ 15, 14 ], walkable: true, transparent: true,
		desc: "Chair"
	},
	chair_right: {
		tileCoords: [ 17, 14 ], walkable: true, transparent: true,
		desc: "Chair"
	},

	barrel_beer: {
		name: "beer barrel", desc: "Here be beer",
		tileCoords: [ 15, 2 ], walkable: false, transparent: true, interactable: true,
		container: "beer"
	},
	barrel_wine: {
		name: "wine barrel", desc: "Here be wine",
		tileCoords: [ 15, 2 ], walkable: false, transparent: true, interactable: true,
		container: "wine"
	},
	barrel_champagne: {
		name: "champagne barrel", desc: "Here be champagne",
		tileCoords: [ 15, 2 ], walkable: false, transparent: true, interactable: true,
		container: "champagne"
	},
	barrel_booze: {
		name: "booze barrel", desc: "Here be booze",
		tileCoords: [ 15, 2 ], walkable: false, transparent: true, interactable: true,
		container: "booze"
	},

	barrel_meat: {
		name: "meat barrel", desc: "Here be meat",
		tileCoords: [ 15, 2 ], walkable: false, transparent: true, interactable: true,
		container: "meat"
	},
	barrel_chicken: {
		name: "chicken barrel", desc: "Here be chicken",
		tileCoords: [ 15, 2 ], walkable: false, transparent: true, interactable: true,
		container: "chicken"
	},
	barrel_stew: {
		name: "stew barrel", desc: "Here be stew",
		tileCoords: [ 15, 2 ], walkable: false, transparent: true, interactable: true,
		container: "stew"
	},
	barrel_fish: {
		name: "fish barrel", desc: "Here be fish",
		tileCoords: [ 15, 2 ], walkable: false, transparent: true, interactable: true,
		container: "fish"
	},

	vomit: {
		name: "vomit", desc: "That's a pool of vomit",
		tileCoords: [ 11, 11 ], walkable: true, transparent: true
	},

	altar: {
		tileCoords: [ 8, 7 ], walkable: true, transparent: true,
		desc: "Gods offer favors for sacrifices on this altar",
		anim: [ [ 8, 7 ], [ 9, 7 ], [ 10, 7 ] ]
	},
	altar_used: {
		tileCoords: [ 8, 6 ], walkable: true, transparent: true,
		desc: "No more sacrifices on this altar",
		anim: [ [ 8, 7 ], [ 9, 7 ], [ 10, 7 ] ]
	},
	key: {
		tileCoords: [ 8, 8 ], walkable: true, transparent: true,
		desc: "A key opens any one locked door"
	},
	coin: {
		tileCoords: [ 8, 9 ], walkable: true, transparent: true,
		desc: "A coin, can be sacrificed on altars"
	},
	gem: {
		tileCoords: [ 11, 9 ], walkable: true, transparent: true,
		desc: "A pretty gem"
	},
	ring: {
		tileCoords: [ 14, 9 ], walkable: true, transparent: true,
		desc: "Token of Victory!"
	},
	potion_health: {
		name: "health potion", desc: "Health potion restores one heart",
		tileCoords: [ 8, 13 ], walkable: true, transparent: true
	},
	beer: {
		name: "beer", desc: "A pint of beer",
		tileCoords: [ 8, 15 ], walkable: true, transparent: true,
		drink: true
	},
	wine: {
		name: "wine", desc: "A glass of wine",
		tileCoords: [ 9, 15 ], walkable: true, transparent: true,
		drink: true
	},
	champagne: {
		name: "champagne", desc: "A bottle of champagne",
		tileCoords: [ 10, 15 ], walkable: true, transparent: true,
		drink: true
	},
	booze: {
		name: "booze", desc: "A glass of booze",
		tileCoords: [ 11, 15 ], walkable: true, transparent: true,
		drink: true
	},
	meat: {
		name: "meat", desc: "Meat",
		tileCoords: [ 0, 15 ], walkable: true, transparent: true,
		food: true
	},
	chicken: {
		name: "chicken", desc: "Chicken",
		tileCoords: [ 1, 15 ], walkable: true, transparent: true,
		food: true
	},
	stew: {
		name: "stew", desc: "Stew",
		tileCoords: [ 2, 15 ], walkable: true, transparent: true,
		food: true
	},
	fish: {
		name: "fish", desc: "Fish",
		tileCoords: [ 3, 15 ], walkable: true, transparent: true,
		food: true
	},

	ui_attention: {
		name: "attention", desc: "",
		tileCoords: [ 17, 15 ], walkable: true, transparent: true
	},
	ui_question: {
		name: "question", desc: "",
		tileCoords: [ 18, 15 ], walkable: true, transparent: true
	},
	ui_love: {
		name: "love", desc: "",
		tileCoords: [ 23, 15 ], walkable: true, transparent: true
	},
	ui_thanks: {
		name: "thanks", desc: "",
		tileCoords: [ 20, 15 ], walkable: true, transparent: true
	},
	ui_plus: {
		name: "plus", desc: "",
		tileCoords: [ 20, 15 ], walkable: true, transparent: true
	},
	ui_disappointed: {
		name: "disappointed", desc: "",
		tileCoords: [ 21, 15 ], walkable: true, transparent: true
	},
	ui_angry: {
		name: "angry", desc: "",
		tileCoords: [ 14, 15 ], walkable: true, transparent: true
	},
	ui_ill: {
		name: "ill", desc: "",
		tileCoords: [ 15, 15 ], walkable: true, transparent: true
	},

	player_male: {
		tileCoords: [ 24, 0 ], walkable: false, transparent: true,
		desc: "That's you!",
		anim: [ [ 23, 0 ], [ 24, 0 ], [ 25, 0 ], [ 24, 0 ] ]
	},
	player_female: {
		tileCoords: [ 27, 0 ], walkable: false, transparent: true,
		desc: "That's you!",
		anim: [ [ 26, 0 ], [ 27, 0 ], [ 28, 0 ], [ 27, 0 ] ]
	},

	patron_male_a: {
		tileCoords: [ 24, 4 ], walkable: false, transparent: true,
		desc: "Old man",
		anim: [ [ 23, 4 ], [ 24, 4 ], [ 25, 4 ], [ 24, 4 ] ]
	},
	patron_female_a: {
		tileCoords: [ 27, 4 ], walkable: false, transparent: true,
		desc: "Old female",
		anim: [ [ 26, 4 ], [ 27, 4 ], [ 28, 4 ], [ 27, 4 ] ]
	},
	patron_male_b: {
		tileCoords: [ 24, 5 ], walkable: false, transparent: true,
		desc: "Patron",
		anim: [ [ 23, 5 ], [ 24, 5 ], [ 25, 5 ], [ 24, 5 ] ]
	},
	patron_female_b: {
		tileCoords: [ 24, 6 ], walkable: false, transparent: true,
		desc: "Patron",
		anim: [ [ 23, 6 ], [ 24, 6 ], [ 25, 6 ], [ 24, 6 ] ]
	},
	patron_male_c: {
		tileCoords: [ 27, 5 ], walkable: false, transparent: true,
		desc: "Patron",
		anim: [ [ 26, 5 ], [ 27, 5 ], [ 28, 5 ], [ 27, 5 ] ]
	},
	patron_female_c: {
		tileCoords: [ 27, 6 ], walkable: false, transparent: true,
		desc: "Patron",
		anim: [ [ 26, 6 ], [ 27, 6 ], [ 28, 6 ], [ 27, 6 ] ]
	},


	
	skeleton: {
		tileCoords: [ 30, 0 ], walkable: false, transparent: true,
		anim: [ [ 29, 0 ], [ 30, 0 ], [ 31, 0 ], [ 30, 0 ] ]
	},
	slime: {
		tileCoords: [ 24, 2 ], walkable: false, transparent: true,
		anim: [ [ 23, 2 ], [ 24, 2 ], [ 25, 2 ], [ 24, 2 ] ]
	},
	bat: {
		tileCoords: [ 24, 1 ], walkable: false, transparent: true,
		anim: [ [ 23, 1 ], [ 24, 1 ], [ 25, 1 ], [ 24, 1 ] ]
	},
	ghost: {
		tileCoords: [ 27, 1 ], walkable: false, transparent: true,
		anim: [ [ 26, 1 ], [ 27, 1 ], [ 28, 1 ], [ 27, 1 ] ]
	},
	spider: {
		tileCoords: [ 30, 1 ], walkable: false, transparent: true,
		anim: [ [ 29, 1 ], [ 30, 1 ], [ 31, 1 ], [ 30, 1 ] ]
	},
	goblin: {
		tileCoords: [ 27, 2 ], walkable: false, transparent: true,
		anim: [ [ 26, 2 ], [ 27, 2 ], [ 28, 2 ], [ 27, 2 ] ]
	},
	rat: {
		tileCoords: [ 30, 2 ], walkable: false, transparent: true,
		anim: [ [ 29, 2 ], [ 30, 2 ], [ 31, 2 ], [ 30, 2 ] ]
	},
	golem: {
		tileCoords: [ 24, 3 ], walkable: false, transparent: true,
		anim: [ [ 23, 3 ], [ 24, 3 ], [ 25, 3 ], [ 24, 3 ] ]
	},
	mummy: {
		tileCoords: [ 27, 3 ], walkable: false, transparent: true,
		anim: [ [ 26, 3 ], [ 27, 3 ], [ 28, 3 ], [ 27, 3 ] ]
	},
	skull: {
		tileCoords: [ 30, 3 ], walkable: false, transparent: true,
		anim: [ [ 29, 3 ], [ 30, 3 ], [ 31, 3 ], [ 30, 3 ] ]
	},

	tileset: null,
	tileArray: [],
	tilemap: {} // Obsolete
};

var DRINKS = {};
var FOOD = {};

(function() {
	if (!CONFIG.server) {
		TILES.tileset = document.createElement("img");
		TILES.tileset.src = "assets/tileset.png";
	}
	for (var i in TILES) {
		var tile = TILES[i];
		if (!tile || !tile.tileCoords) continue;
		tile.id = i;
		tile.name = tile.name || i;
		tile.name = tile.name[0].toUpperCase() + tile.name.substr(1);
		tile.ch = TILES.tileArray.length;
		tile.tileCoords[0] *= (CONFIG.tileSize + CONFIG.tileGap);
		tile.tileCoords[1] *= (CONFIG.tileSize + CONFIG.tileGap);
		if (tile.anim) {
			for (var a = 0; a < tile.anim.length; ++a) {
				tile.anim[a][0] *= (CONFIG.tileSize + CONFIG.tileGap);
				tile.anim[a][1] *= (CONFIG.tileSize + CONFIG.tileGap);
			}
		}
		TILES.tileArray.push(tile);
		if (tile.drink)
			DRINKS[i] = tile;
		if (tile.food)
			FOOD[i] = tile;
	}
})();


var IMGS = {
	bubble1: {
		src: "assets/bubble1.png"
	},
	bubble2: {
		src: "assets/bubble2.png"
	},
	bubble3: {
		src: "assets/bubble3.png"
	}
};

(function() {
	if (CONFIG.server)
		return;
	for (var i in IMGS) {
		var img = IMGS[i];
		if (img && img.src) {
			img.id = i;
			img.img = new Image();
			img.img.src = img.src;
		}
	}
})();


// Don't add ids to mobs, as they will be generated for uniqueness
var MOBS = {
	skeleton: {
		name: "Skeleton", ch: TILES.skeleton.ch, ai: "hunter",
		desc: "Dangerous and rather scary",
		health: 3, vision: 9, speed: 1,
		loot: TILES.coin, lootChance: 0.5
	},
	goblin: {
		name: "Goblin", ch: TILES.goblin.ch, ai: "hunter",
		desc: "Tough enemy",
		health: 4, vision: 8, speed: 0.1,
		loot: TILES.coin, lootChance: 1
	},
	mummy: {
		name: "Mummy", ch: TILES.mummy.ch, ai: "hunter",
		desc: "Scary and semi-dangerous",
		health: 2, vision: 3, speed: 0.75,
		loot: TILES.coin, lootChance: 0.5
	},
	patron_male_a: {
		name: "Patron", ch: TILES.patron_male_a.ch, ai: "patron",
		desc: "Scary and semi-dangerous",
		health: 2, vision: 3, speed: 0.75,
		loot: TILES.coin, lootChance: 0.5
	},
	patron_male_b: {
		name: "Patron", ch: TILES.patron_male_b.ch, ai: "patron",
		desc: "Scary and semi-dangerous",
		health: 2, vision: 3, speed: 0.75,
		loot: TILES.coin, lootChance: 0.5
	},
	patron_male_c: {
		name: "Patron", ch: TILES.patron_male_c.ch, ai: "patron",
		desc: "Scary and semi-dangerous",
		health: 2, vision: 3, speed: 0.75,
		loot: TILES.coin, lootChance: 0.5
	},
	patron_female_a: {
		name: "Patron", ch: TILES.patron_female_a.ch, ai: "patron",
		desc: "Scary and semi-dangerous",
		health: 2, vision: 3, speed: 0.75,
		loot: TILES.coin, lootChance: 0.5
	},
	patron_female_b: {
		name: "Patron", ch: TILES.patron_female_b.ch, ai: "patron",
		desc: "Scary and semi-dangerous",
		health: 2, vision: 3, speed: 0.75,
		loot: TILES.coin, lootChance: 0.5
	},
	patron_female_c: {
		name: "Patron", ch: TILES.patron_female_c.ch, ai: "patron",
		desc: "Scary and semi-dangerous",
		health: 2, vision: 3, speed: 0.75,
		loot: TILES.coin, lootChance: 0.5
	}
};


var SOUNDS = {
	click: {
		src: "assets/sounds/click"
	},
	pickup: {
		src: "assets/sounds/pickup"
	},
	powerup: {
		src: "assets/sounds/powerup"
	},
	door_locked: {
		src: "assets/sounds/door_locked"
	},
	door_open: {
		src: "assets/sounds/door_open"
	},
	hit: {
		src: "assets/sounds/hit"
	},
	miss: {
		src: "assets/sounds/miss"
	}
};

(function() {
	if (CONFIG.server)
		return;
	var format = ".ogg";
	if (document.createElement("audio").canPlayType("audio/mp3"))
		format = ".mp3";
	for (var i in SOUNDS) {
		SOUNDS[i].id = i;
		SOUNDS[i].audio = new Audio(SOUNDS[i].src + format);
	}
})();

var LEVELS = [
	{
		name: "Level 1",
		desc: "The Pranching Pony",
		generator: "inn",
		width: 16,
		height: 12,
		wall: [ TILES.wall_logs ],
		XXXfloor: [ TILES.floor_dirt_a, TILES.floor_dirt_b, TILES.floor_dirt_c, TILES.floor_dirt_d ],
		floor: [ TILES.floor_dirt_dunes ],
		table: [ TILES.table_worn ],
		counter: [ TILES.counter ],
		chair: [ TILES.chair_worn_left, TILES.chair_worn_right ],
		decor: [ TILES.pot, TILES.pot_damaged, TILES.pot_broken ],
		decorAmount: 10,
		mobs: [ MOBS.goblin ],
		mobAmount: 0,
		items: [ ],
		itemAmount: 0,
		drinks: [ TILES.beer, TILES.booze ],
		food: [ TILES.stew ]
	},{
		name: "Level 2",
		desc: "The Pranching Pony",
		generator: "inn",
		width: 16,
		height: 15,
		wall: [ TILES.wall_stone_old ],
		floor: [ TILES.floor_cobblestone, TILES.floor_cobblestone ],
		table: [ TILES.table ],
		counter: [ TILES.counter ],
		chair: [ TILES.chair_left, TILES.chair_right ],
		decor: [ TILES.cupboard, TILES.pot ],
		decorAmount: 10,
		mobs: [ MOBS.goblin ],
		mobAmount: 0,
		items: [ ],
		itemAmount: 0,
		drinks: [ TILES.beer, TILES.wine, TILES.booze ],
		food: [ TILES.chicken, TILES.stew ]
	},{
		name: "Level 3",
		desc: "The Pranching Pony",
		generator: "inn",
		width: 20,
		height: 15,
		wall: [ TILES.wall_stone2 ],
		floor: [ TILES.floor_marble_a, TILES.floor_marble_b, TILES.floor_marble_c, TILES.floor_marble_d ],
		table: [ TILES.table ],
		counter: [ TILES.counter ],
		chair: [ TILES.chair_left, TILES.chair_right ],
		decor: [ TILES.cupboard, TILES.pot ],
		decorAmount: 10,
		mobs: [ MOBS.goblin ],
		mobAmount: 0,
		items: [ ],
		itemAmount: 0,
		drinks: [ TILES.beer, TILES.wine, TILES.champagne, TILES.booze ],
		food: [ TILES.chicken, TILES.fish ]
	},{
		name: "Level 4",
		desc: "The Pranching Pony",
		generator: "inn",
		width: 20,
		height: 15,
		wall: [ TILES.wall_stone2 ],
		floor: [ TILES.floor_marble_a, TILES.floor_marble_b, TILES.floor_marble_c, TILES.floor_marble_d ],
		table: [ TILES.table ],
		counter: [ TILES.counter ],
		chair: [ TILES.chair_left, TILES.chair_right ],
		decor: [ TILES.cupboard, TILES.pot ],
		decorAmount: 10,
		mobs: [ MOBS.goblin ],
		mobAmount: 0,
		items: [ ],
		itemAmount: 0,
		drinks: [ TILES.beer, TILES.wine, TILES.champagne, TILES.booze ],
		food: [ TILES.chicken, TILES.fish ]
	}
];

(function() {
	for (var i = 0; i < LEVELS.length; ++i)
		LEVELS[i].id = i;
})();
