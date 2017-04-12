var chokidar = require('chokidar');
var {CasparCG} = require('casparcg-connection')
var libqueue = require('./lib/queue.js');
var parser = require('./lib/parser.js');
var fs = require('fs');
var config;

var connection;// = new CasparCG({onConnected: connected});
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

queue = libqueue(connection);

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


/* Schedule checking
 * Check to add to queue every second
 */

function checkSchedule() {
	if (schedule === undefined) setTimeout(checkSchedule, 1000);
	let curDate = new Date('2017-4-12 07:00:00');

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
schedule = {'07:00:00':{}}
checkSchedule();




/* Timetable parsing
 * Read the timetable on startup and when it changes.
 */

function timesChanged () {
    // parser.execute(timetable, library);
}

var timesFile = chokidar.watch(config.timetable);

timesFile.on('change', () => {
	let times = fs.readFileSync(config.timetable);

	try {
		timetable = JSON.parse(times);
		timesChanged();
	}
	catch (err) {
		console.log('error parsing config!');
	}
})

try {
	let times = fs.readFileSync(config.timetable);
	timetable = JSON.parse(times);
	timesChanged();
}
catch (err) {
	console.log('error parsing config!', err);
}

