var parser = {};
var mediaLibrary = [];

// credit to orafaelreis and Ed Sykes from StackOverflow
Date.prototype.getWeek = function() {
    var onejan = new Date(this.getFullYear(),0,1);
    var millisecsInDay = 86400000;
    return Math.ceil((((this - onejan) /millisecsInDay) + onejan.getDay()+1)/7);
};

function generateDateObject(time) {
    let parts = time.split(':');
    let date = new Date();
    date.setHours(parts[0]);
    date.setMinutes(parts[1]);
    date.setSeconds(parts[2]);
    date.setMilliseconds(0);
    return date;
}



function checkPriority(playlist) {
    for (let time in playlist) {
        let endTime = new Date(generateDateObject(time).getTime() + playlist[time].duration*1000).toLocaleTimeString('en-US', {hour12: false});
        for (let checkTime in playlist) {
            if (time < checkTime && endTime > checkTime) {
                let startClip = generateDateObject(time);
                for (let clip of playlist[time].clips) {
                    let endClip = new Date(startClip.getTime() + clip.duration*1000);
                    if (endClip.toLocaleTimeString('en-US', {hour12: false}) > checkTime) {
                        let insert = false;
                        let append = false;
                        for (let breakingClip of playlist[checkTime].clips) {
                            if (breakingClip.priority > clip.priority)
                                insert = true;
                            else if (breakingClip.priority === clip.priority)
                                append = true;
                        }
                        if (insert) {
                            let clipIndex = playlist[time].clips.indexOf(clip);
                            for (let breakingClip of playlist[checkTime].clips) {
                                playlist[time].clips.push(breakingClip, clipIndex);
                                playlist[time].duration += breakingClip.duration;
                            }
                        } else if (append) {
                            for (let breakingClip of playlist[checkTime].clips) {
                                playlist[time].clips.push(breakingClip);
                                playlist[time].duration += breakingClip.duration;
                            }
                        }
                        delete playlist[checkTime];
                        break;
                    }
                    startClip = endClip;
                }
            }
        }
    }
}

function addFolder(item, playlist, timing) {
    let clips = [];

    for (let clip of mediaLibrary)
        if (clip.name.search(item.path.toUpperCase()) === 0)
            clips.push(clip);
    
    for (let clip of clips)
        clip.priority = item.priority;

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

function addFile(item, playlist, timing) {
    let clip;

    for (let mediaClip of mediaLibrary)
        if (mediaClip.name.search(item.path.toUpperCase()) === 0)
            clip = mediaClip;
    
    if (clip === undefined) return;
    clip.priority = item.priority;

    for (let time of timing)
        if (/(\d){2}(:){1}(\d){2}(:){1}(\d){2}/.test(time)) {
            if (!playlist[time])
                playlist[time] = {duration: 0, clips: []};
            playlist[time].duration += clip.duration;
            playlist[time].clips.push(clip);
        }
}

function checkExecution(item, playlist, curDate, lookback, parentTiming) {
    if (!item.priority) item.priority = 100;
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

    if (weekOrMonth())
        if (day()) {
            if (item.type === 'group')
                for (let child of item.children)
                    checkExecution(child, playlist, curDate, lookback, timing());
            if (item.type === 'folder')
                addFolder(item, playlist, timing());
            if (item.type === 'file')
                addFile(item, playlist, timing());
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
    checkPriority(result);
    return result;
}

module.exports = parser;