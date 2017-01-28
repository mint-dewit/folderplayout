var chokidar = require('chokidar');
var {CasparCG} = require('casparcg-connection')
var mediaHelper = require('./lib/mediaHelper.js');
var libqueue = require('./lib/queue.js');
var fs = require('fs');

var connection = new CasparCG({onConnected: connected});
var clips = {Playlist: []};
var queue;
var timetable;
var watched = [];
var mediaFolder;

queue = libqueue(connection);

function connected () {
	console.log('connected');
	connection.clear(1);
	connection.play
	(1, 10, 'DECKLINK 1');
}

function fileAdded (path) {
	var folder = mediaHelper.parseFolder(path);
	var parsedPath = mediaHelper.parsePath(path);
	var parsedFile = mediaHelper.parseFileName(path);

	connection.cinf(parsedFile).then(casparObject => {
		var parsedDuratiion = mediaHelper.parseDuration(casparObject.response.data.duration, casparObject.response.data.fps);
		clips[folder].push({path: parsedPath, name: parsedFile, duration: parsedDuratiion});
		clips[folder].sort(mediaHelper.compareClipOrder);
		console.log(clips);
	})
}

function fileChanged (path) {
	var parsedPath = mediaHelper.parsePath(path);
	var parsedFile = mediaHelper.parseFileName(path);

	for (let clip of clips) {
		if (clip.path === parsedPath) {
			connection.cinf(parsedFile).then(casparObject => {
				clip.path = parsedPath;
				clip.name = parsedFile;
				clip.duration = mediaHelper.parseDuration(casparObject.response.data.duration, casparObject.response.data.fps);
				clip.created = casparObject.response.data.created;
				clips.sort(mediaHelper.compareClipOrder);
			});
		}
	}
}

function fileRemoved (path) {
	var parsedPath = mediaHelper.parsePath(path);

	for (var i in clips) {
		if (clips[i].path === parsedPath) {
			clips.splice(i, 1);
			clips.sort(mediaHelper.compareClipOrder);
		}
	}
}

var playbackDirectories = chokidar.watch('../Server/media/Playlist'); // hardcoded path is questionable

playbackDirectories
	.on('add', fileAdded)
	.on('change', fileChanged)
	.on('unlink', fileRemoved);

function timesChanged () {
	for (let dir in timetable) {
		let found = false;
		for (let watcher of watched) {
			if (watcher === dir) found = true;
		}
		if (!found) {
			watched.push(dir);
			console.log('../Server/media/'+dir)
			playbackDirectories.add('../Server/media/'+dir);
			clips[dir] = [];
		}
	}

	for (var i in watched) {
		let found = false
		for (let dir in timetable) {
			if (dir === watched[i]) {
				found = true;
			}
		}
		if (!found) {
			watched.splice(i, 1);
			playbackDirectories.unwatch('../Server/media/'+dir);
			clips[dir] = undefined
		}
	}
}

var configFile = chokidar.watch('./timetable.json');

configFile.on('change', () => {
	var config = fs.readFileSync('./timetable.json');

	try {
		timetable = JSON.parse(config);
		configChanged();
	}
	catch (err) {
		console.log('error parsing config!');
	}
})

function checkTime () {
	var date = new Date ();

	if (date.getMinutes() === 59 && date.getSeconds() === 58) {
		console.log('load');
		connection.mixerVolume(1, 10, 0, 50);
		for (let clip of clips.Playlist) queue.add(clip);
		for (var dir in timetable) {
			for (let time of timetable[dir]) {
				if (time-1 === date.getHours()) {
					console.log('append folder:', dir);
					for (let clip of clips[dir]) queue.add(clip);
				}
			}
		}
		setTimeout(checkTime, 1000);
	}
	else if (date.getMinutes() === 0 && date.getSeconds() === 0) {
		queue.play();
		setTimeout(checkTime, 1000);
	} else {
		setTimeout(checkTime, 50);
	}
}

try {
	let times = fs.readFileSync('./timetable.json');
	timetable = JSON.parse(times);
	timesChanged();
}
catch (err) {
	console.log('error parsing config!', err);
}

checkTime();

