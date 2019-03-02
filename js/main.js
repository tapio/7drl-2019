var camera, ui, world; // Globals

window.onload = function() {
	try {
		camera = {};
		world = new World();
		ui = new UI(null);

		if (CONFIG.debug) $("#debug").style.display = "block";

		var frameTime = performance.now();
		function tick(time) {
			var dt = (time - frameTime) / 1000;
			frameTime = time;
			ui.fps = 0.1 * (1 / dt) + 0.9 * ui.fps;

			var t0, t1, t2;
			if (CONFIG.debug) t0 = performance.now();
			world.update(dt);
			if (CONFIG.debug) t1 = performance.now();
			ui.render(camera, world.dungeon);
			if (CONFIG.debug) t2 = performance.now();
			ui.update();
			if (CONFIG.debug) {
				t3 = performance.now();
				$("#time-update").innerHTML = (t1-t0).toFixed(2);
				$("#time-render").innerHTML = (t2-t1).toFixed(2);
				$("#time-ui").innerHTML = (t3-t2).toFixed(2);
			}
			requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);

	} catch(e) {
		$("#error").style.display = "block";
		$("#error").innerHTML = "ERROR: " + e.message + "\n" + e.stack;
		console.error(e);
	}
};
