var events = require('events');

var interface = new events.EventEmitter();
interface.app;

queue = [];
queueState = 'stopped';
audioState = 'muted';

interface.add = function (clip) {
	clip.loaded = false;
	queue.push(clip);
	console.log('load', clip)
	interface.app.server.broadcast('QUEUE LOADED', clip);
	if (queue.length === 1) {
		interface.app.connection.loadbg(1, 20, clip.name);
		clip.loaded = true;
	}
	else if (queue.length === 2 && queueState === 'playing') {
		interface.app.connection.loadbg(1, 20, clip.path);
		clip.loaded = true;
	}
}

interface.play = function () {
	if (queue[0] === undefined) return;
	queue[0].startedPlaying = new Date();
	queue[0].expectedEnd = new Date();
	queue[0].expectedEnd.setMilliseconds(queue[0].expectedEnd.getMilliseconds() + (queue[0].duration)*1000);
	queueState = 'playing';
	interface.app.connection.play(1, 20);
	interface.app.server.broadcast('QUEUE PLAYING');
}

interface.stop = function () {
	if (queueState === 'stopped') return;
	interface.app.connection.stop(1, 20);
	queue.splice(0,1)
	queueState = 'stopped';
	interface.app.server.broadcast('QUEUE STOPPED');
}

interface.clear = function () {
	if (queueState = 'playing') {
		interface.app.connection.stop(1, 20);
	}
	queue = [];
	queueState = 'stopped';
	interface.app.server.broadcast('QUEUE CLEARED');
}

interface.getQueue = function () {
	return queue;
}

interface.next = function () {
	if (queue[1] !== undefined) {
		queue[1].startedPlaying = new Date();
		queue[1].expectedEnd = new Date();
		queue[1].expectedEnd.setMilliseconds(queue[1].expectedEnd.getMilliseconds() + (queue[1].duration)*1000);

		if (queue[1].audio === true && audioState == 'muted') {
			interface.setMuted(false, 500);
		} else if (queue[1].audio === false && audioState == 'playing') {
			interface.setMuted(true, 500);
		}

		queue.splice(0, 1);
		interface.app.connection.play(1, 20)
		console.log('play next');
		interface.app.server.broadcast('QUEUE NEXT');
	} else {
		queue.splice(0, 1);
		interface.app.connection.stop(1, 20);
		queueState = 'stopped';
		interface.emit('queue-empty');
		interface.app.server.broadcast('QUEUE EMPTY');
	}
}

/**
 * Mutes / unmutes the currently playing and correctly sets the volume infochannel.
 * @param {Boolean} status To mute the playing item or not
 * @param {Number} time Time for transition in ms
 */
interface.setMuted = function (status, time) {
	if (!time)
		time = 0;
	let frames = Math.round(time * (1/40));

	if ((status === undefined || status === true) && audioState == 'playing') {
		audioState = 'muted';
		interface.app.connection.mixerVolume(1, 20, 0, frames);
		interface.app.connection.mixerVolume(1, 10, 1, frames);
	} else if (status === false && audioState == 'muted') {
		audioState = 'playing';
		interface.app.connection.mixerVolume(1, 20, 1, frames);
		interface.app.connection.mixerVolume(1, 10, 0, frames);
	}
}

interface.getAudioState = function () {
	return audioState;
}

function check () {
	if (queueState === 'playing') {
		var date = new Date();

		// if the current clip has no audio, and the next clip does, then mute the infochannel 2 seconds ahead of clip start.
		if (date > queue[0].expectedEnd-2000 && queue[1] && queue[1].audio && audioState == 'muted') {
			let time = queue[0].expectedEnd - date;
			interface.setMuted(false, time < 2000 ? time : 2000);
		}

		if (date > queue[0].expectedEnd) {
			if (queue[1] !== undefined) {
				queue[1].startedPlaying = new Date();
				queue[1].expectedEnd = new Date();
				queue[1].expectedEnd.setMilliseconds(queue[1].expectedEnd.getMilliseconds() + (queue[1].duration)*1000);

				if (queue[1].audio === false && audioState == 'playing') {
					let time = 2000;
					if (queue[1].length < 4) {
						let time = queue[1].length / 2 * 1000;
					}
					interface.setMuted(true, time);
				}

				queue.splice(0, 1);
				interface.app.connection.play(1, 20);
				console.log('play next');
				interface.app.server.broadcast('QUEUE NEXT');
			} else {
				queue.splice(0, 1);
				interface.app.connection.stop(1, 20);
				queueState = 'stopped';
				interface.emit('queue-empty');
				interface.app.server.broadcast('QUEUE EMPTY');
			}
		}

		if (queue[1] !== undefined) {
			if (queue[1].loaded === false) {
				interface.app.connection.loadbg(1, 20, queue[1].path);
				console.log('load next');
				queue[1].loaded = true;
			}
		}
	}

	setTimeout(check, 20);
}

setTimeout(check, 20);

module.exports = (app) => {
	interface.app = app;
	return interface;
};