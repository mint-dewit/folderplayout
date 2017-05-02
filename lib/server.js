var io = require('socket.io')(80);
var events = require('events');
var server = new events.EventEmitter();

var secret = '';
var peers = []

server.init = function (config) {
    if (config.secret)
        secret = config.secret
    
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

        this.socket.on('TAKE', this.queueTake);

        this.socket.on('PARSE SCHEDULE', this.parseSchedule);

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

    queueTake () {
        server.app.queue.next();
    }

    parseSchedule (schedule, date) {
        if (schedule) {
            this.socket.emit('RETURN SCHEDULE', server.app.parser.execute(schedule, new Date(date)));
        }
    }

    sendAmcp (commandString) {
        server.app.connection.do(commandString);
    }
}

server.broadcast = function(ev, args) {
    for (let socket of peers)
        socket.socket.emit(ev, args);
}

module.exports = function (app) {
    server.app = app;
};