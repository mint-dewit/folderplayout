var chokidar = require('chokidar');
var {CasparCG} = require('casparcg-connection')
var mediaHelper = require('./lib/mediaHelper.js');
var libqueue = require('./lib/queue.js');
var fs = require('fs');
var config;

var connection = new CasparCG({onConnected: connected});
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

function connected () {
	console.log('connected');
	connection.clear(1);
	connection.playDecklink(1, 10, config.device);

	connection.getCasparCGPaths().then((casparPaths) => {
		if (casparPaths.media.substring(0,1) === "/")
			mediaFolder = casparPaths.media;
		else
			mediaFolder = casparPaths.root + casparPaths.media;
		
		gotMediaFolder();
	})
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
	var folder = mediaHelper.parseFolder(path);
	var parsedPath = mediaHelper.parsePath(path);
	var parsedFile = mediaHelper.parseFileName(path);

	for (let clip of clips[folder]) {
		if (clip.path === parsedPath) {
			connection.cinf(parsedFile).then(casparObject => {
				clip.path = parsedPath;
				clip.name = parsedFile;
				clip.duration = mediaHelper.parseDuration(casparObject.response.data.duration, casparObject.response.data.fps);
				clip.created = casparObject.response.data.created;
				clips[folder].sort(mediaHelper.compareClipOrder);
			});
		}
	}
}

function fileRemoved (path) {
	var folder = mediaHelper.parseFolder(path);
	var parsedPath = mediaHelper.parsePath(path);

	for (var i in clips[folder]) {
		if (clips[folder][i].path === parsedPath) {
			clips[folder].splice(i, 1);
			clips[folder].sort(mediaHelper.compareClipOrder);
		}
	}
}

function gotMediaFolder() {
	playbackDirectories = chokidar.watch(mediaFolder + 'Playlist');

	playbackDirectories
		.on('add', fileAdded)
		.on('change', fileChanged)
		.on('unlink', fileRemoved);
	
	timesChanged();
}

function timesChanged () {
	if (mediaFolder === undefined) return;
	for (let dir in timetable) {
		let found = false;
		for (let watcher of watched) {
			if (watcher === dir) found = true;
		}
		if (!found) {
			watched.push(dir);
			console.log(mediaFolder+dir)
			playbackDirectories.add(mediaFolder+dir);
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
			playbackDirectories.unwatch(mediaFolder+dir);
			clips[dir] = undefined
		}
	}
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

function checkTime () {
	var date = new Date ();
	var mute = false;

	if (date.getMinutes() === 59 && date.getSeconds() === 58) {
		console.log('load');
		for (let clip of clips.Playlist) {
			queue.add(clip);
			mute = true;
		}
		for (var dir in timetable) {
			for (let time of timetable[dir]) {
				if (time-1 === date.getHours()) {
					console.log('append folder:', dir);
					for (let clip of clips[dir]) {
						mute = true;
						queue.add(clip);
					}
				}
			}
		}
		if (mute) connection.mixerVolume(1, 10, 0, 50);
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

