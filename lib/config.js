var chokidar = require('chokidar');
var fs = require('fs');
var config;

var timesFile = chokidar.watch('../config.json');

timesFile.on('change', () => {
	var file = fs.readFileSync('../config.json');

	try {
		config = JSON.parse(config);
		timesChanged();
	}
	catch (err) {
		console.log('error parsing config!');
	}
})

try {
    config = JSON.parse(fs.readFileSync('../config.json'););
    timesChanged();
}
catch (err) {
    console.log('error parsing config!');
}

module.exports = config;