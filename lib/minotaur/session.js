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
    this._clients = {};
    this._clientsCount = 0;
    
    this._firstClientID = null;
    // for storing extra data within session
    this._data = null; 
};

Session.prototype = new process.EventEmitter();

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

Object.defineProperty(Session.prototype, "clientsCount", {
    get: function() {
        return this._clientsCount;
    }
});

Object.defineProperty(Session.prototype, "firstClientID", {
    get: function() {
        return this._firstClientID;
    }
});

Object.defineProperty(Session.prototype, "data", {
    get: function() {
        return this._data;
    },
    set: function(value) {
        this._data = value;
    }
});

Session.prototype.attachClient = function(clientID, response) {
    this._firstClientID = clientID;
    
    this._clients[clientID] = {
        id: clientID,
        response: null,
        timestamp: new Date().getTime(),
        heartbeat: null
    };

    this._clientsCount++;
};

Session.prototype.detachClient = function(clientID) {
    delete this._clients[clientID];
    this._clientsCount--;
};

Session.prototype.getClient = function(clientID) {
    return this._clients[clientID];
};

Session.prototype.forEachClient = function(callback) {
    for(var item in this._clients) {
        callback(this._clients[item]);
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
    for(var item in this._clients) {
        if(this._clients[item].heartbeat != null) {
	        clearTimeout(this._clients[item].heartbeat);
	        this._clients[item].heartbeat = null;
	    }
    }
    // queue message into buffer
    this._messageBuffer.push(message);
};