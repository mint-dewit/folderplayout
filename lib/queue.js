interface = {};
interface.connection;

queue = []
queueState = 'stopped'

interface.add = function (clip) {
	clip.loaded = false;
	queue.push(clip);
	if (queue.length === 1) {
		interface.connection.loadbg(1, 20, clip.path);
		clip.loaded = true;
	}
}

interface.play = function () {
	if (queue[0] === undefined) return;
	queue[0].startedPlaying = new Date();
	queue[0].expectedEnd = new Date();
	queue[0].expectedEnd.setMilliseconds(queue[0].expectedEnd.getMilliseconds() + (queue[0].duration)*1000);
	queueState = 'playing';
	interface.connection.play(1, 20);
}

interface.stop = function () {
	if (queueState === 'stopped') return;
	interface.connection.stop(1, 20);
	queue.splice(0,1)
	queueState = 'stopped';
}

interface.clear = function () {
	if (queueState = 'playing') {
		interface.connection.stop(1, 20);
	}
	queue = [];
	queueState = 'stopped';
}

function check () {
	if (queueState === 'playing') {
		var date = new Date();

		if (date > queue[0].expectedEnd) {
			if (queue[1] !== undefined) {
				queue[1].startedPlaying = new Date();
				queue[1].expectedEnd = new Date();
				queue[1].expectedEnd.setMilliseconds(queue[1].expectedEnd.getMilliseconds() + (queue[1].duration)*1000);
				queue.splice(0, 1);
				interface.connection.play(1, 20)
				console.log('play next');
			} else {
				queue.splice(0, 1);
				interface.connection.stop(1, 20);
				interface.connection.mixerVolume(1, 10, 1, 50);
				queueState = 'stopped';
			}
		}

		if (queue[1] !== undefined) {
			if (queue[1].loaded === false) {
				interface.connection.loadbg(1, 20, queue[1].path);
				console.log('load next');
				queue[1].loaded = true;
			}
		}
	}

	setTimeout(check, 20);
}

setTimeout(check, 20);

module.exports = (connection) => {
	interface.connection = connection;
	return interface;
};