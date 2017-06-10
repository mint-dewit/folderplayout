var io = require('socket.io');
var events = require('events');
var server = new events.EventEmitter();

var secret = '';
var peers = []

server.init = function (config) {
    if (!config.ws) {
        console.log('ERR: WS Server configuration not found.');
        return;
    }
    if (config.secret)
        secret = config.secret
    
    var ws = io(config.ws);
    
    io.on('connection', (socket) => {
        socket.on('secret', (clientSecret) => {
            if (clientSecret === secret) {
                socket.emit('authenticated');
                peers.push(new ControlSocket(socket));
            } else {
                socket.emit('unauthorized');
                socket.disconnect();
            }
        })
    })
}

class ControlSocket {
    constructor(socket) {
        this.socket = socket;

        this.socket.on('RETRIEVE LIBRARY', this.getLibrary);
        this.socket.on('RETRIEVE QUEUE', this.getQueue);
        this.socket.on('RETRIEVE SCHEDULE', this.getSchedule);
        this.socket.on('RETRIEVE TIMETABLE', this.getTimetable);

        this.socket.on('TAKE', this.queueTake);

        this.socket.on('PARSE SCHEDULE', this.parseSchedule);
        this.socket.on('UPDATE SCHEDULE', this.updateSchedule);

        this.socket.on('AMCP', this.sendAmcp);

        this.socket.on('disconnect', function () {
            peers.splice(sockets.indexOf(this), 1);
        });
    }

    getLibrary () {
        this.socket.emit('DATA LIBRARY', server.app.library);
    }

    getQueue () {
        this.socket.emit('DATA QUEUE', server.app.queue);
    }

    getSchedule () {
        this.socket.emit('DATA SCHEDULE', server.app.schedule);
    }

    getTimetable () {
        this.socket.emit('DATA TIMETABLE', server.app.timetable);
    }

    queueTake () {
        server.app.queue.next();
    }

    parseSchedule (schedule, date) {
        if (schedule)
            this.socket.emit('RETURN TIMETABLE', server.app.parser.execute(schedule, new Date(date)));
    }

    updateTimetable (schedule) {
        if (schedule) {
            server.app.schedule = schedule;
            server.app.timetable = server.parser.execute();
            server.app.writeSchedule(schedule);
            this.socket.emit('DATA SCHEDULE', server.app.schedule);
            this.socket.emit('DATA TIMETABLE', server.app.timetable);
        }
    }

    sendAmcp (commandString) {
        server.app.connection.do(commandString);
    }
}

server.broadcast = function(ev, args) {
    for (let peer of peers)
        peer.socket.emit(ev, args);
}

module.exports = function (app) {
    server.app = app;
};