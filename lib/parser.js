var parser = {};

parser.execute = function(timetable) {
    for (let item of timetable) {
        console.log(item);
    }
}

module.exports = parser;