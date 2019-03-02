
function UI(player) {
	this.actor = player;
	this.messages = [];
	this.messagesDirty = false;
	this.display = null;
	this.fps = 0;
	this.mouse = { x: 0, y: 0, downTime: 0, longpress: false };
	this.pressed = [];
	this.characterChoice = null;
	this.dom = {
		fps: $("#fps"),
		depth: $("#depth"),
		coins: $("#coins"),
		messages: $("#messages")
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
	CONFIG.debug = window.location.search.indexOf("?debug") != -1;
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
	$("#death-restart").addEventListener("click", function() {
		window.location.reload();
	}, false);
	$("#win-restart").addEventListener("click", function() {
		window.location.reload();
	}, false);
	$("#new-male").addEventListener("click", function() {
		this.classList.add("btn-selected");
		$("#new-female").classList.remove("btn-selected");
		$("#new-ok").classList.remove("btn-disabled");
		ui.characterChoice = "player_male";
	}, false);
	$("#new-female").addEventListener("click", function() {
		this.classList.add("btn-selected");
		$("#new-male").classList.remove("btn-selected");
		$("#new-ok").classList.remove("btn-disabled");
		ui.characterChoice = "player_female";
	}, false);
	$("#new-ok").addEventListener("click", function() {
		ui.actor = world.create();
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
		var whitelist = [ "#main", "#new", "#help", "#about" ];
		if (hash.length < 2 || (whitelist.indexOf(hash) == -1 && this.characterChoice === null)) {
			window.location.hash = "#main";
			return;
		}
		if (hash == "#win" || hash == "#death") {
			window.location.hash = "#game";
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
	e.preventDefault();
};

UI.prototype.onKeyUp = function(e) {
	this.pressed[e.keyCode] = false;
};

UI.prototype.resetDisplay = function() {
	var w = Math.floor(document.documentElement.clientWidth / CONFIG.tileSize / SETTINGS.tileMag);
	var h = Math.floor(document.documentElement.clientHeight / CONFIG.tileSize / SETTINGS.tileMag);
	camera = { pos: [0, 0], offset: [0, 0], center: [(w/2)|0, (h/2)|0] };

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

	this.dom.fps.innerHTML = Math.round(this.fps);

	if (!this.actor)
		return;

	this.dom.depth.innerHTML = world.dungeon.id;
	this.dom.coins.innerHTML = this.actor.coins;

	if (!CONFIG.touch) {
		var cursor = "default";
		var mx = this.mouse.x, my = this.mouse.y;
		if (this.actor.path.length || world.currentActor != this.actor) {
			cursor = "wait";
		} else if (this.actor.visibility(mx, my) > 0.1) {
			if (world.dungeon.getTile(mx, my, Dungeon.LAYER_ITEM))
				cursor = "cell";
			else if (world.dungeon.getPassable(mx, my))
				cursor = "crosshair";
		}
		this.display.getContainer().style.cursor = cursor;
	}
};

UI.prototype.render = function(camera, dungeon) {
	if (!this.actor) {
		camera.pos[0] = dungeon.start[0] - camera.center[0];
		camera.pos[1] = dungeon.start[1] - camera.center[1];
		world.dungeon.draw(camera, this.display, {
			visibility: function(x, y) {
				return (x < 0 || y < 0 || x >= dungeon.width || y >= dungeon.height) ? 0 : 1;
			}
		});
		return;
	}
	camera.pos[0] = this.actor.pos[0] - camera.center[0];
	camera.pos[1] = this.actor.pos[1] - camera.center[1];
	if (this.actor.moved) {
		camera.offset[0] = this.actor.pos[0] - this.actor.animPos[0];
		camera.offset[1] = this.actor.pos[1] - this.actor.animPos[1];
	} else {
		camera.offset[0] = 0;
		camera.offset[1] = 0;
	}
	world.dungeon.draw(camera, this.display, this.actor);
};

UI.prototype.die = function() {
	var stats = ui.actor.stats;
	$("#death-turns").innerHTML = Math.round(stats.turns);
	$("#death-kills").innerHTML = Math.round(stats.kills);
	$("#death-depth").innerHTML = Math.round(world.dungeon.id);
	$("#death-coins").innerHTML = Math.round(stats.coins);
	$("#death").style.display = "block";
	world.running = false;
};

UI.prototype.win = function() {
	var stats = ui.actor.stats;
	$("#win-turns").innerHTML = Math.round(stats.turns);
	$("#win-kills").innerHTML = Math.round(stats.kills);
	$("#win-depth").innerHTML = Math.round(world.dungeon.id);
	$("#win-coins").innerHTML = Math.round(stats.coins);
	$("#win").style.display = "block";
	world.running = false;
};
