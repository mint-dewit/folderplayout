var chokidar = require('chokidar');
var {CasparCG} = require('casparcg-connection')
var libqueue = require('./lib/queue.js');
var parser = require('./lib/parser.js');
var fs = require('fs');
var config;

var connection = new CasparCG({onConnected: connected});
var queue;
var timetable;
var schedule;

// data part of casparcg-connection response from cls connection
// example dummy data
var library = [
	{ name: 'DAILY/CLIP1', type: 'video', size: 6445960, changed: 1481832374000, frames: 268, frameTime: '1/25', frameRate: 25, duration: 10.72 },
	{ name: 'DAILY/CLIP2', type: 'video', size: 6445960, changed: 1481832374000, frames: 268, frameTime: '1/25', frameRate: 25, duration: 10.72 },
	{ name: 'DAYS/SUNDAY/CLIP1', type: 'video', size: 6445960, changed: 1481832374000, frames: 268, frameTime: '1/25', frameRate: 25, duration: 10.72 },
	{ name: 'DAYS/SUNDAY/CLIP1', type: 'video', size: 6445960, changed: 1481832374000, frames: 268, frameTime: '1/25', frameRate: 25, duration: 10.72 },
	{ name: 'PRIORITY', type: 'video', size: 6445960, changed: 1481832374000, frames: 134, frameTime: '1/25', frameRate: 25, duration: 5.36 }
]
var libraryWatcher;

function connected () {
	connection.getCasparCGPaths().then((casparPaths) => {
		console.log(casparPaths.root + casparPaths.media)
		queue = libqueue(connection);
		libraryWatcher = chokidar.watch(casparPaths.root + casparPaths.media);
		libraryWatcher
			.on('add', libraryChanged)
			.on('change', libraryChanged)
			.on('unlink', libraryChanged)
		libraryChanged();
	})
}

/* Config parsing
 * Read the config on start up
 */

try {
    config = JSON.parse(fs.readFileSync('./config.json'));
    console.log('parsed conf ', config)
}
catch (err) {
    console.log('error parsing config!');
	process.exit();
}


/* Media library watcher
 *
 */

function libraryChanged() {
	if (connection.connected) {
		connection.cls().then((responseObject) => {
			library = responseObject;
		})
	}
}

/* Schedule checking
 * Check to add to queue every second
 */

function checkSchedule() {
	if (schedule === undefined) setTimeout(checkSchedule, 1000);
	let curDate = new Date();

	for (let time in schedule) {
		if ((new Date(curDate.getTime() + 2000)).toLocaleTimeString('en-US', {hour12:false}) === time) {
			console.log('mute + add to queue');
			// connection.mixerVolume(1, 10, 0, 50);
			for (let clip of schedule[time].clips)
				queue.add(clip);
		} else if (curDate.toLocaleTimeString('en-US', {hour12:false}) === time) {
			console.log('play queue!');
			// queue.play()
		}
	}
}

checkSchedule();




/* Timetable parsing
 * Read the timetable on startup and when it changes.
 */

function timesFileChanged() {
	try {
		let times = fs.readFileSync(config.timetable);
		timetable = JSON.parse(times);
		// parser.execute(timetable, library);
	}
	catch (err) {
		console.log('error parsing config!');
	}
}

var timesFile = chokidar.watch(config.timetable);

timesFile.on('change', timesFileChanged)

timesFileChanged();

