var interface = {}

interface.parseFileName = function (path) {
	var pathArray = path.split('/'); // not cross platform at all. weren't you developing for windows and caspar @ 2.0.7???
	var fileName = pathArray[pathArray.length-1];
	var fileWithoutExtenstion = fileName.split('.')[0];

	return fileWithoutExtenstion.toUpperCase();
}

interface.parseFolder = function (path) {
	var pathArray = path.split('\/'); // this way of parsing is very wrong.. it assumes the media folder is actually called Media, and also assumes it is the only one called Media in the full path.
	while (pathArray[0] !== 'media') {
		pathArray.splice(0,1);
	}
	pathArray.splice(0,1);
	return pathArray[0];
}

interface.parsePath = function (path) {
	var pathArray = path.split('\/'); // this way of parsing is very wrong.. it assumes the media folder is actually called Media, and also assumes it is the only one called Media in the full path.
	while (pathArray[0] !== 'media') {
		pathArray.splice(0,1);
	}
	pathArray.splice(0,1);
	var pathArray = pathArray.join('\/').split('.');
	var parsedPath = pathArray.splice(0,1).join('.').toUpperCase();
	return parsedPath;
}

interface.parseDuration = function (duration, fps) {
	var frameLength = (fps.search('/') === -1) ? fps : (fps.split('/')[0] / fps.split('\/')[1]);
	return frameLength * duration;
}

interface.compareClipOrder = function (clipA, clipB) {
	if (clipA.name > clipB.name) return 1;
	if (clipA.name < clipB.name) return -1;
	return 0;
}

module.exports = interface;