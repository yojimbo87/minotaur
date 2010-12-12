var sys = require("sys");

/*-----------------------------------------------
  Session
-----------------------------------------------*/
module.exports = Session;

function Session(sessionID) {
    // unique ID of the session
    this._sid = sessionID;
    // messages to be sent in the next interval
    this._messageBuffer = [];
    // array of connected clients bound to this session
    this._clients = [];
};

Session.prototype = process.EventEmitter();

Object.defineProperty(Session.prototype, "sid", {
    get: function() {
        return this._sid;
    }
});

Object.defineProperty(Session.prototype, "messageBuffer", {
    get: function() {
        return this._messageBuffer;
    },
    set: function(value) {
        this._messageBuffer = value;
    }
});

Object.defineProperty(Session.prototype, "clients", {
    get: function() {
        return this._clients;
    }
});

Session.prototype.attachClient = function(token, response) {
    var client = {
        token: token,
        response: response,
        timestamp: new Date().getTime(),
        heartbeat: null
    };
    
    this._clients.push(client);
};

Session.prototype.detachClient = function(token) {
    for(var index in this._clients) {
        if(this._clients[index].token == token) {
            this._clients.splice(index, 1);
            break;
        }
    }
};

Session.prototype.findClient = function(token, callback) {
    for(var index in this._clients) {
        if(this._clients[index].token == token) {
            callback(this._clients[index]);
            break;
        }
    }
};

Session.prototype.forEachClient = function(callback) {
    for(var index in this._clients) {
        callback(this._clients[index]);
    }
};

Session.prototype.receiveMessage = function(message) {
    this.emit("message", message);
};

Session.prototype.disconnect = function() {
    this.emit("disconnect");
};

// queues message into buffer to be sent when next interval is fired
Session.prototype.queueMessage = function(message) {
    // stop polling timeout for this session clients
    for(var index in this._clients) {
	    if(this._clients[index].heartbeat != null) {
	        clearTimeout(this._clients[index].heartbeat);
	    }
    }
    // queue message into buffer
    this._messageBuffer.push(message);
};
