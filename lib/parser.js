var parser = {};
var mediaLibrary = [];

// credit to orafaelreis and Ed Sykes from StackOverflow
Date.prototype.getWeek = function() {
    var onejan = new Date(this.getFullYear(),0,1);
    var millisecsInDay = 86400000;
    return Math.ceil((((this - onejan) /millisecsInDay) + onejan.getDay()+1)/7);
};



function addFolder(path, playlist, timing) {
    console.log('add folder '+ path, timing);
    let clips = [];

    for (let clip of mediaLibrary)
        if (clip.name.search(path.toUpperCase()) === 0)
            clips.push(clip);

    for (let time of timing)
        if (/(\d){2}(:){1}(\d){2}(:){1}(\d){2}/.test(time)) {
            if (!playlist[time])
                playlist[time] = {duration: 0, clips: []};
            for (let clip of clips) {
                playlist[time].duration += clip.duration;
                playlist[time].clips.push(clip);
            }
        }
}

function addFile(path, playlist, timing) {
    console.log('add file ', path, timing);
    let clip;

    for (let mediaClip of mediaLibrary)
        if (mediaClip.name.search(path.toUpperCase()) === 0)
            clip = mediaClip;

    for (let time of timing)
        if (/(\d){2}(:){1}(\d){2}(:){1}(\d){2}/.test(time)) {
            if (playlist[time])
                playlist[time] = {duration: 0, clips: []};
            playlist[time].duration += clip.duration;
            playlist[time].clips.push(clip);
        }
}

function checkExecution(item, playlist, curDate, lookback, parentTiming) {
    var toDateString = date => date.getFullYear() +'-'+ date.getMonth() +'-'+ date.getDate();
    var weekOrMonth = () => {
        if (!item.weeks && !item.dates)
            return true;
        if (item.weeks && item.weeks.indexOf(curDate.getWeek()) > -1)
            return true;
        if (item.dates) 
            for (let dateRange of item.dates) 
                if (dateRange[0] <= toDateString(curDate) && dateRange[1] >= toDateString(curDate))
                    return true;
        return false;
    }
    var day = () => {
        if (!item.days) return true;
        return item.days.indexOf(curDate.getDay()) > -1
    }
    var timing = () => {
        if (!item.times) return parentTiming;
        var timeArray = []
        for (let time of item.times) {
            if (lookback) {
                if (time < curDate.toLocaleTimeString('en-US', {hour12: false}))
                    timeArray.push(time);
            } else {
                if (time > curDate.toLocaleTimeString('en-US', {hour12: false}))
                    timeArray.push(time);
            }
        }
        return timeArray;
    }
    // console.log('lookback:', lookback, ' timing:', timing())

    if (weekOrMonth())
        if (day()) {
            if (item.type === 'group')
                for (let child of item.children)
                    checkExecution(child, playlist, curDate, lookback, timing());
            if (item.type === 'folder')
                addFolder(item.path, playlist, timing());
            if (item.type === 'file')
                addFile(item.path, playlist, timing());
        }
}

parser.execute = function(timetable, library) {
    if (library) mediaLibrary = library;
    if (mediaLibrary.length === 0) { console.log('ERR: no media in Media Library.'); return; }


    var curDate = new Date();
    var tomorrow = new Date(curDate.getTime() + 24 * 60 * 60 * 1000);
    var result = {};
    for (let item of timetable) {
        checkExecution(item, result, curDate, false);
        checkExecution(item, result, tomorrow, true);
    }
    console.log(result);
    return result;
}

module.exports = parser;