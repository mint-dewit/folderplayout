var chokidar = require('chokidar');
var {CasparCG} = require('casparcg-connection')
var mediaHelper = require('./lib/mediaHelper.js');
var libqueue = require('./lib/queue.js');
var parser = require('./lib/parser.js');
var fs = require('fs');
var config;

var connection;// = new CasparCG({onConnected: connected});
var clips = {Playlist: []};
var queue;
var timetable;
var watched = [];
var mediaFolder;
var playbackDirectories;

queue = libqueue(connection);

try {
    config = JSON.parse(fs.readFileSync('./config.json'));
    console.log('parsed conf ', config)
}
catch (err) {
    console.log('error parsing config!');
	process.exit();
}

function timesChanged () {
    parser.execute(timetable);
}

var timesFile = chokidar.watch(config.timetable);

timesFile.on('change', () => {
	var config = fs.readFileSync(config.timetable);

	try {
		timetable = JSON.parse(config);
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

