var parser = {};

// credit to orafaelreis and Ed Sykes from StackOverflow
Date.prototype.getWeek = function() {
    var onejan = new Date(this.getFullYear(),0,1);
    var millisecsInDay = 86400000;
    return Math.ceil((((this - onejan) /millisecsInDay) + onejan.getDay()+1)/7);
};

function checkExecution(item) {
    var curDate = new Date();
    var toDateString = date => date.getFullYear() +'-'+ date.getMonth() +'-'+ date.getDate();
    var weekOrMonth = () => {
        if (!item.weeks && !item.dates)
            return true;

        if (item.weeks && item.weeks.indexOf(curDate.getWeek()) > -1)
            return true;
        
        if (item.dates) for (let dateRange of item.dates) 
            if (dateRange[0] <= toDateString(curDate) && dateRange[1] >= toDateString(curDate))
                return true;

        return false;
    }

    if (weekOrMonth()) {
        if (item.days.indexOf(curDate.getDay()) > -1) {
            return item.times;
        }
    }
}

parser.execute = function(timetable) {
    for (let item of timetable) {
        console.log(checkExecution(item));
    }
}

module.exports = parser;