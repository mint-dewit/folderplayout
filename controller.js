var chokidar = require('chokidar');
var {CasparCG} = require('casparcg-connection');
var fs = require('fs');
var libqueue = require('./lib/queue.js');
var libparser = require('./lib/parser.js');

var app = {};

app.connection = new CasparCG({onConnected: connected});
app.queue = libqueue(app);
app.parser = libparser(app);

var firstConnect = true;



function connected () {
	if (firstConnect) {
		app.connection.playDecklink(1, 10, app.config.device)
		app.connection.getCasparCGPaths().then((casparPaths) => {
			app.libraryWatcher = chokidar.watch(casparPaths.root + casparPaths.media, {ignoreInitial: true});
			app.libraryWatcher
				.on('add', libraryChanged)
				.on('change', libraryChanged)
				.on('unlink', libraryChanged);
			libraryChanged();
		})
	}
		
	firstConnect = false;
}

/* app.config parsing
 * Read the app.config on start up
 */

try {
    app.config = JSON.parse(fs.readFileSync('./config.json'));
}
catch (err) {
	process.exit();
}


/* Media library watcher
 *
 */

function libraryChanged() {
	if (app.connection.connected) {
		app.connection.cls().then((responseObject) => {
			app.library = responseObject.response.data;
			app.schedule = app.parser.execute();
		})
	}
}

/* Schedule checking
 * Check to add to queue every second
 */

function checkSchedule() {
	if (app.schedule === undefined) {
		setTimeout(checkSchedule, 1000);
		return
	}
	
	let curDate = new Date();

	for (let time in app.schedule) {
		if ((new Date(curDate.getTime() + 2000)).toLocaleTimeString('en-US', {hour12:false}) === time) {
			console.log('mute + add to queue');
			app.connection.mixerVolume(1, 10, 0, 50);
			for (let clip of app.schedule[time].clips)
				app.queue.add(clip);
		} else if (curDate.toLocaleTimeString('en-US', {hour12:false}) === time) {
			console.log('play queue!');
			app.queue.play()
		}
	}
	setTimeout(checkSchedule, 1000)
}

checkSchedule();

// Part of schedule checking: return mixervolume.
app.queue.on('queue-empty', () => {
	app.connection.mixerVolume(1, 10, 1, 50);
})




/* Timetable parsing
 * Read the timetable on startup and when it changes.
 */

function timesFileChanged() {
	try {
		let times = fs.readFileSync(app.config.timetable);
		app.timetable = JSON.parse(times);
		app.schedule = app.parser.execute();
		console.log(app.schedule)
	}
	catch (err) {
		console.log('error parsing config!', err);
	}
}

var timesFile = chokidar.watch(app.config.timetable);

timesFile.on('change', timesFileChanged)

timesFileChanged();


/* Update schedule every 6 hours.
 */

setInterval(() => { app.schedule = app.parser.execute(timetable, library); }, 6 * 60 * 60 * 1000);
