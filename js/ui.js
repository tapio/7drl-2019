
function UI(player) {
	this.actor = player;
	this.messages = [];
	this.messagesDirty = false;
	this.display = null;
	this.fps = 0;
	this.mouse = { x: 0, y: 0, downTime: 0, longpress: false };
	this.pressed = [];
	this.characterChoice = null;
	this.hostingChoice = null;
	this.levelChoice = LEVELS[0];
	this.gameName = "";
	this.playerName = "Noname";
	this.client = null;
	this.dom = {
		fps: $("#fps"),
		messages: $("#messages"),
		timeLeft: $("#time-left"),
		gold: $("#gold"),
		reputation: $("#reputation"),
		invItems: $("#inv-items")
	};

	// Load settings
	var savedSettings = window.localStorage.getItem("SETTINGS");
	if (savedSettings) {
		savedSettings = JSON.parse(savedSettings);
		for (var i in SETTINGS) {
			if (savedSettings.hasOwnProperty(i))
				SETTINGS[i] = savedSettings[i];
		}
	}
	function saveSettings() {
		window.localStorage.setItem("SETTINGS", JSON.stringify(SETTINGS));
	}

	this.resetDisplay();
	window.addEventListener('resize', this.resetDisplay.bind(this));
	document.addEventListener('keydown', this.onKeyDown.bind(this), false);
	document.addEventListener('keyup', this.onKeyUp.bind(this), false);

	navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
	if (!navigator.vibrate || !CONFIG.touch)
		$("#pausemenu-vibration").style.display = "none";

	if (!CONFIG.touch) {
		$(".btn", function(elem) {
			elem.classList.add("btn-no-touch");
		});
	}

	function toggleFullscreen() {
		if (!document.fullscreenElement && !document.mozFullScreenElement &&
			!document.webkitFullscreenElement && !document.msFullscreenElement)
		{
			var d = document.documentElement;
			if (d.requestFullscreen) d.requestFullscreen();
			else if (d.msRequestFullscreen) d.msRequestFullscreen();
			else if (d.mozRequestFullScreen) d.mozRequestFullScreen();
			else if (d.webkitRequestFullscreen) d.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
		} else {
			if (document.exitFullscreen) document.exitFullscreen();
			else if (document.msExitFullscreen) document.msExitFullscreen();
			else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
			else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
		}
	}
	function genGameId() {
		var key = { 'i': 'w', 'l': 'x', 'o': 'y', 'u': 'z' }; // Crockford's Base32
		var randomInt = Math.floor(Math.random() * 1048576); // 32^4
		return randomInt.toString(32).replace(/[ilou]/, function (a) { return key[a]; });
	}
	function validateNewGame() {
		var valid = !!ui.hostingChoice && (!!ui.characterChoice || ui.hostingChoice === "host-only") && !!ui.gameName /*&& !!ui.playerName*/;
		if (valid)
			$("#new-ok").classList.remove("btn-disabled");
		else
			$("#new-ok").classList.add("btn-disabled");
	}
	function onClickLevelButton(e) {
		// this = clicked element
		$("#new-level-select > div", function(elem) { elem.classList.remove("btn-selected"); });
		ui.levelChoice = LEVELS[this.dataset.index];
		world.resetMap(ui.levelChoice);
		this.classList.add("btn-selected");
		validateNewGame();
	}
	function setupGameSetupScreen() {
		var hostOnly = ui.hostingChoice === "host-only";
		var joinOnly = ui.hostingChoice === "join";
		$("#new-host-only-info").style.display = hostOnly ? "block" : "none";
		$("#new-character-select").style.display = hostOnly ? "none" : "block";
		//$("#new-name").style.display = hostOnly ? "none" : "block";
		$("#join-game-name").style.display = joinOnly ? "block" : "none";
		$("#new-level-select").style.display = joinOnly ? "none" : "block";
		// Generate level buttons
		$("#new-level-select").innerHTML = "";
		for (var i = 0; i < LEVELS.length; ++i) {
			var level = LEVELS[i];
			var elem = document.createElement("div");
			elem.className = "btn btn-text-thin";
			if (i > GAMESAVE.unlockedLevel) {
				elem.classList.add("btn-disabled");
			} else if (i == GAMESAVE.unlockedLevel) {
				ui.levelChoice = level;
				elem.classList.add("btn-selected");
			}
			elem.innerHTML = level.name;
			elem.dataset.index = i;
			elem.addEventListener("click", onClickLevelButton);
			$("#new-level-select").appendChild(elem);
		}
		var spacer = document.createElement("div");
		spacer.innerHTML = "&nbsp;";
		$("#new-level-select").appendChild(spacer);
		world.resetMap(ui.levelChoice);
		validateNewGame();
	}
	$("#new-solo").addEventListener("click", function() {
		ui.hostingChoice = "solo";
		ui.gameName = "__solo__";
		setupGameSetupScreen();
	}, false);
	$("#new-join").addEventListener("click", function() {
		ui.hostingChoice = "join";
		ui.gameName = "";
		setupGameSetupScreen();
	}, false);
	$("#new-host-join").addEventListener("click", function() {
		ui.hostingChoice = "host-join";
		ui.gameName = genGameId();
		setupGameSetupScreen();
	}, false);
	$("#new-host-only").addEventListener("click", function() {
		ui.hostingChoice = "host-only";
		ui.gameName = genGameId();
		setupGameSetupScreen();
	}, false);
	$("#join-game-name").addEventListener("input", function() {
		ui.gameName = this.value;
		validateNewGame();
	}, false);
	//$("#new-name").addEventListener("input", function() {
	//	ui.playerName = this.value.toLowerCase();
	//	validateNewGame();
	//}, false);
	$("#main-fullscreen").addEventListener("click", toggleFullscreen, false);
	$("#new-fullscreen").addEventListener("click", toggleFullscreen, false);
	$("#pausemenu-fullscreen").addEventListener("click", toggleFullscreen, false);
	$("#pausemenu-tilesize").addEventListener("click", function() {
		SETTINGS.tileMag = SETTINGS.tileMag === 2 ? 3 : 2;
		saveSettings();
		ui.msg("Using " + (SETTINGS.tileMag === 2  ? "normal tiles." : "large tiles."));
		ui.resetDisplay();
	}, false);
	$("#pausemenu-sounds").addEventListener("click", function() {
		SETTINGS.sounds = !SETTINGS.sounds;
		saveSettings();
		ui.msg("Sounds " + (SETTINGS.sounds ? "enabled." : "disabled."));
	}, false);
	$("#pausemenu-vibration").addEventListener("click", function() {
		SETTINGS.vibration = !SETTINGS.vibration;
		saveSettings();
		ui.msg("Vibration " + (SETTINGS.vibration ? "enabled." : "disabled."));
	}, false);
	$("#pausemenu-restart").addEventListener("click", function() {
		window.location.reload();
	}, false);
	$("#end-restart").addEventListener("click", function() {
		window.location.reload(); // TODO: More graceful restart preserving players
	}, false);
	$("#disconnected-restart").addEventListener("click", function() {
		window.location.reload(); // TODO: More graceful restart preserving players
	}, false);
	$("#new-male").addEventListener("click", function() {
		this.classList.add("btn-selected");
		$("#new-female").classList.remove("btn-selected");
		ui.characterChoice = "player_male";
		validateNewGame();
	}, false);
	$("#new-female").addEventListener("click", function() {
		this.classList.add("btn-selected");
		$("#new-male").classList.remove("btn-selected");
		ui.characterChoice = "player_female";
		validateNewGame();
	}, false);
	$("#new-ok").addEventListener("click", function() {
		CONFIG.host = ui.hostingChoice !== "join";
		if (ui.hostingChoice !== "host-only") {
			var def = {
				id: "NOT_SET",
				name: ui.playerName,
				desc: "That's you!",
				ch: TILES[ui.characterChoice].ch
			};
			var pl = new Actor(world.dungeon.start[0], world.dungeon.start[1], def);
			pl.updateVisibility();
			world.addActor(pl);
			ui.actor = pl;
		}
		if (ui.hostingChoice !== "solo") {
			var clientParams = {
				server: CONFIG.serverAddress,
				host: CONFIG.host,
				join: ui.hostingChoice !== "host-only",
				game: ui.gameName,
				actor: ui.actor
			};
			ui.client = new Client(clientParams);
		}
		$("#wait-gameid").innerHTML = ui.gameName;
		var neededPlayers = ui.hostingChoice === "solo" ? 1 : 2;
		(function checkStart() {
			if (window.location.hash == "#disconnected") {
				$("#wait").style.display = "none";
				return;
			}
			if (world.dungeon.actors.length < neededPlayers) {
				$("#wait").style.display = "block";
				window.setTimeout(checkStart, 100);
				return;
			}
			$("#wait").style.display = "none";
			$("#status").classList.remove("hidden");
			if (ui.actor)
				$("#inv").classList.remove("hidden");
			else
				$("#inv").classList.add("hidden");
			world.start();
		})();

		// "Liberate" sounds in user gesture so that they work on mobile
		for (var sound in SOUNDS) {
			if (SOUNDS[sound].audio)
				SOUNDS[sound].audio.load();
		}
	}, false);

	function back() { window.history.back(); }
	$(".back", function(elem) {
		elem.addEventListener("click", back, false);
	});

	function closeAllMenus() {
		$(".modal", function (elem) { elem.style.display = "none"; });
	}

	var handleHash = (function() {
		var hash = window.location.hash;
		closeAllMenus();
		if (hash == "#new" && !this.hostingChoice) {
			window.location.hash = "#main";
			return;
		}
		var whitelist = [ "#main", "#new", "#help", "#about" ];
		if (hash.length < 2 || (whitelist.indexOf(hash) == -1 && !this.hostingChoice)) {
			window.location.hash = "#main";
			return;
		}
		if (hash == "#end") {
			window.location.hash = "#game";
			return;
		}
		if (hash == "#new" && !this.hostingChoice) {
			window.location.hash = "#main";
			return;
		}
		if (hash == "#new" && world.running) {
			window.location.hash = "#game";
			return;
		}
		if (hash == "#game") {
			return;
		}
		var menudiv = $(hash);
		if (menudiv) menudiv.style.display = "block";
	}).bind(this);
	window.addEventListener("hashchange", handleHash, true);
	handleHash();
}

UI.prototype.onClick = function(e) {
	if (!this.actor)
		return;
	e.preventDefault();
	var coords = this.display.eventToPosition(e);
	var x = coords[0] + camera.pos[0];
	var y = coords[1] + camera.pos[1];
	if (ui.actor.visibility(x, y) < 0.1)
		return;
	if (e.type === "contextmenu" || this.mouse.longpress) {
		var thing = world.dungeon.getTile(x, y);
		var desc = "Nothing interesting...";
		if (thing instanceof Actor) {
			desc = thing.name + " - " + thing.desc;
		} else if (thing.desc) {
			desc = thing.desc;
		} else if (thing.name) {
			desc = thing.name;
		}
		this.msg(desc);
	} else if (ui.actor.moveTo(x, y)) {
		this.snd("click");
	}
};

UI.prototype.onMouseMove = function(e) {
	var coords = this.display.eventToPosition(e);
	this.mouse.x = coords[0] + camera.pos[0];
	this.mouse.y = coords[1] + camera.pos[1];
};

UI.prototype.onMouseDown = function(e) {
	this.mouse.downTime = Date.now();
	this.mouse.longpress = false;
};

UI.prototype.onMouseUp = function(e) {
	var upTime = Date.now();
	this.mouse.longpress = (upTime - this.mouse.downTime < 500) ? false : true;
};

UI.prototype.onKeyDown = function(e) {
	ui.pressed[e.keyCode] = true;
	if (this.pressed[ROT.VK_CONTROL] || this.pressed[ROT.VK_ALT]) // CTRL/ALT for browser hotkeys
		return;
	if (e.keyCode >= ROT.VK_F1 && e.keyCode <= ROT.VK_F12) // F1-F12
		return;

	if (window.location.hash === "#game") {
		if (e.keyCode == ROT.VK_LEFT || e.keyCode == ROT.VK_NUMPAD4 || e.keyCode == ROT.VK_H)
			this.actor.move(-1, 0);
		else if (e.keyCode == ROT.VK_RIGHT || e.keyCode == ROT.VK_NUMPAD6 || e.keyCode == ROT.VK_L)
			this.actor.move(1, 0);
		else if (e.keyCode == ROT.VK_UP || e.keyCode == ROT.VK_NUMPAD8 || e.keyCode == ROT.VK_K)
			this.actor.move(0, -1);
		else if (e.keyCode == ROT.VK_DOWN || e.keyCode == ROT.VK_NUMPAD2 || e.keyCode == ROT.VK_J)
			this.actor.move(0, 1);
		else if (e.keyCode == ROT.VK_INSERT || e.keyCode == ROT.VK_NUMPAD7 || e.keyCode == ROT.VK_Y)
			this.actor.move(-1, -1);
		else if (e.keyCode == ROT.VK_PAGE_UP || e.keyCode == ROT.VK_NUMPAD9 || e.keyCode == ROT.VK_U)
			this.actor.move(1, -1);
		else if (e.keyCode == ROT.VK_DELETE || e.keyCode == ROT.VK_NUMPAD1 || e.keyCode == ROT.VK_B)
			this.actor.move(-1, 1);
		else if (e.keyCode == ROT.VK_PAGE_DOWN || e.keyCode == ROT.VK_NUMPAD3 || e.keyCode == ROT.VK_N)
			this.actor.move(1, 1);
	}
	else if (window.location.hash !== "#new") {
		e.preventDefault();
	}
};

UI.prototype.onKeyUp = function(e) {
	this.pressed[e.keyCode] = false;
};

UI.prototype.resetDisplay = function() {
	var w = Math.floor(document.documentElement.clientWidth / CONFIG.tileSize / SETTINGS.tileMag);
	var h = Math.floor(document.documentElement.clientHeight / CONFIG.tileSize / SETTINGS.tileMag);
	camera = { pos: [0, 0], offset: [0, 0], center: [(w/2)|0, (h/2)|0], w: w, h: h };

	if (this.display)
		document.body.removeChild(this.display.getContainer());

	// TODO: Display not used for actual rendering, could remove
	this.display = new ROT.Display({
		width: w,
		height: h,
		bg: "#111",
		layout: "tile",
		fontSize: CONFIG.tileSize,
		tileWidth: CONFIG.tileSize,
		tileHeight: CONFIG.tileSize,
		tileSet: TILES.tileset,
		tileMap: TILES.tilemap,
		tileColorize: false
	});
	this.display._tick = function() {}; // Disable dirty updates, we do our own drawing
	var ctx = this.display.getContainer().getContext("2d");
	if (ctx.imageSmoothingEnabled === undefined) {
		ctx.mozImageSmoothingEnabled = false;
		ctx.webkitImageSmoothingEnabled = false;
		ctx.msImageSmoothingEnabled = false;
	} else ctx.imageSmoothingEnabled = false;
	document.body.appendChild(this.display.getContainer());
	this.display.getContainer().style.width = Math.floor(w * CONFIG.tileSize * SETTINGS.tileMag) + "px";
	this.display.getContainer().style.height = Math.floor(h * CONFIG.tileSize * SETTINGS.tileMag) + "px";
	this.display.getContainer().addEventListener("click", this.onClick.bind(this), true);
	this.display.getContainer().addEventListener("contextmenu", this.onClick.bind(this), true);
	this.display.getContainer().addEventListener("mousemove", this.onMouseMove.bind(this), true);
	this.display.getContainer().addEventListener("mousedown", this.onMouseDown.bind(this), true);
	this.display.getContainer().addEventListener("mouseup", this.onMouseUp.bind(this), true);
	world.dungeon.needsRender = true;
};

UI.prototype.msg = function(msg, source, type) {
	if (source === undefined || source == this.actor) {
		this.messages.push({ msg: msg, type: type || "info" });
		this.messagesDirty = true;
	}
};

UI.prototype.snd = function(sound, source) {
	if (!SETTINGS.sounds || (source !== undefined && source !== this.actor))
		return;
	var audio = typeof sound == "string" ? SOUNDS[sound].audio : sound.audio;
	audio.play();
};

UI.prototype.vibrate = function(pattern, source) {
	if (!SETTINGS.vibration || (source !== undefined && source !== this.actor))
		return;
	if (navigator.vibrate)
		navigator.vibrate(pattern);
};

UI.prototype.update = function() {
	/*if (!world.running) {
		var actors = world.dungeon.actors;
		var text = actors.length ? "" : "No one yet";
		for (var i = 0; i < actors.length; i++) {
			text += actors[i].name;
			if (i < actors.length - 1)
				text += ", ";
		}
		$("#wait-players").innerHTML = text;
	}*/

	if (this.messagesDirty) {
		var msgBuf = "";
		var firstMsg = Math.max(this.messages.length-5, 0);
		var classes = [ "msg4", "msg3", "msg2", "msg1", "msg0" ];
		if (this.messages.length <= 4) classes.shift();
		if (this.messages.length <= 3) classes.shift();
		if (this.messages.length <= 2) classes.shift();
		if (this.messages.length <= 1) classes.shift();
		var templ = '<div class="%1% %2%">%3%</div>\n';
		for (var i = firstMsg; i < this.messages.length; ++i)
			msgBuf += templ.replace("%1%", classes.shift())
				.replace("%2%", this.messages[i].type)
				.replace("%3%", this.messages[i].msg);
		this.dom.messages.innerHTML = msgBuf;
		this.messagesDirty = false;
	}

	if (CONFIG.debug)
		this.dom.fps.innerHTML = Math.round(this.fps);

	if (world.running) {
		var minutes = Math.floor(game.timeLeft / 60);
		var seconds = Math.floor(game.timeLeft - minutes * 60);
		if (game.timeLeft <= 0)
			this.dom.timeLeft.innerHTML = "0";
		else if (minutes > 0)
			this.dom.timeLeft.innerHTML = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
		else
			this.dom.timeLeft.innerHTML = seconds;

		this.dom.gold.innerHTML = Math.round(game.gold);
		this.dom.reputation.innerHTML = Math.round(game.reputation);
	}

	if (!this.actor)
		return;

	var invCount = this.actor.items.length;
	var invText = invCount ? "" : "Nothing";
	for (var i = 0; i < invCount; i++) {
		invText += this.actor.items[i].name;
		if (i < invCount - 1)
			invText += ", ";
	}
	this.dom.invItems.innerHTML = invText;

	if (!CONFIG.touch) {
		var cursor = "default";
		var mx = this.mouse.x, my = this.mouse.y;
		/*if (this.actor.path.length || world.currentActor != this.actor) {
			cursor = "wait";
		} else*/ if (this.actor.visibility(mx, my) > 0.1) {
			if (world.dungeon.getTile(mx, my, Dungeon.LAYER_ITEM))
				cursor = "cell";
			else if (world.dungeon.getTargetable(mx, my))
				cursor = "crosshair";
		}
		this.display.getContainer().style.cursor = cursor;
	}
};

UI.prototype.render = function(camera, dungeon) {
	if (!this.actor) {
		camera.pos[0] = ((dungeon.width / 2)|0) - camera.center[0];
		camera.pos[1] = ((dungeon.height / 2)|0) - camera.center[1];
		world.dungeon.draw(camera, this.display, {
			visibility: function(x, y) {
				return (x < 0 || y < 0 || x >= dungeon.width || y >= dungeon.height) ? 0 : 1;
			}
		});
		return;
	}
	// Static viewport if everything fits the screen, otherwise follow player
	var xFits = dungeon.width <= camera.w;
	var yFits = dungeon.height <= camera.h;
	var refX = xFits ? ((dungeon.width / 2)|0) : this.actor.pos[0];
	var refY = yFits ? ((dungeon.height / 2)|0) : this.actor.pos[1];

	camera.pos[0] = refX - camera.center[0];
	camera.pos[1] = refY - camera.center[1];

	// Calculate offset for animation
	if (this.actor.moved) {
		camera.offset[0] = xFits ? 0 : (this.actor.pos[0] - this.actor.animPos[0]);
		camera.offset[1] = yFits ? 0 : (this.actor.pos[1] - this.actor.animPos[1]);
	} else {
		camera.offset[0] = 0;
		camera.offset[1] = 0;
	}

	// Clamp to borders to always maximize visible area
	if (!xFits) {
		if (camera.pos[0] - camera.offset[0] < 0) {
			camera.pos[0] = 0;
			camera.offset[0] = 0;
		}
		if (camera.pos[0] + camera.w - camera.offset[0] >= dungeon.width) {
			camera.pos[0] = dungeon.width - camera.w;
			camera.offset[0] = 0;
		}
	}
	if (!yFits) {
		if (camera.pos[1] - camera.offset[1] < 0) {
			camera.pos[1] = 0;
			camera.offset[1] = 0;
		}
		if (camera.pos[1] + camera.h - camera.offset[1] >= dungeon.height) {
			camera.pos[1] = dungeon.height - camera.h;
			camera.offset[1] = 0;
		}
	}

	world.dungeon.draw(camera, this.display, this.actor);
};

UI.prototype.end = function() {
	var stats = ui.actor.stats;
	$("#end").style.display = "block";
	$("#end-gold").innerHTML = game.gold;
	$("#end-reputation").innerHTML = game.reputation;
	world.running = false;

	var stars = game.calculateStars();
	$("#star1").className = stars >= 1 ? "star" : "star-dim";
	$("#star2").className = stars >= 2 ? "star" : "star-dim";
	$("#star3").className = stars >= 3 ? "star" : "star-dim";

	if (GAMESAVE.unlockedLevel >= LEVELS.length - 1) {
		$("#end-unlock-info").innerHTML = ""; // Nothing to achieve anymore :/
	} else if (stars < 2) {
		$("#end-unlock-info").innerHTML = "Get at least 🍺🍺 to unlock next level!";
	} else if (stars >= 2) {
		GAMESAVE.unlockedLevel++;
		game.save();
		$("#end-unlock-info").innerHTML = "You unlocked " + LEVELS[GAMESAVE.unlockedLevel].name + "!!!";
	}
};

UI.prototype.showNetworkError = function(errMsg) {
	if (errMsg)
		$("#disconnected-msg").innerHTML = errMsg;
	$("#disconnected").style.display = "block";
	window.location.hash = "#disconnected";
	world.running = false;
};
