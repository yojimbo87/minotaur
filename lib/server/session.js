var util = require("util"),
    Uuid = require("./node-uuid/uuid.js");

/*------------------------------------------------------------------------------
  Module constructor
------------------------------------------------------------------------------*/

var Session = module.exports = function Session(sessionID) {	
	// unique ID of the session
    this._sid = sessionID;
    // messages to be sent in the next interval
    this._messageBuffer = [];
    // hash list of connected clients bound to this session
    this._clients = {};
	// total number of connected clients bound to this session
    this._clientsCount = 0;
    // storage for extra data within session
    this._data = null; 
	
    this._lastAssignedClientID = null;
	this._lastAssignedPollDomain = null;
};

Session.prototype = new process.EventEmitter();

/*------------------------------------------------------------------------------
  Properties
------------------------------------------------------------------------------*/

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

Object.defineProperty(Session.prototype, "clientsCount", {
    get: function() {
        return this._clientsCount;
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

Object.defineProperty(Session.prototype, "lastAssignedClientID", {
    get: function() {
        return this._lastAssignedClientID;
    }
});

Object.defineProperty(Session.prototype, "lastAssignedPollDomain", {
    get: function() {
        return this._lastAssignedPollDomain;
    }
});

/*------------------------------------------------------------------------------
  Public methods
------------------------------------------------------------------------------*/
	
Session.prototype.attachClient = function(response, pollDomain) {
	var client = {
		id: Uuid(),
        response: null,
        timestamp: new Date().getTime(),
		pollDomain: pollDomain,
        heartbeat: null
	};
	
    this._clients[client.id] = client;
    this._clientsCount++;
	this._lastAssignedClientID = client.id;
	this._lastAssignedPollDomain = client.pollDomain;
	
	util.log("  +C " + client.id + " [" + this._clientsCount + "]");
};

Session.prototype.detachClient = function(clientID) {
    delete this._clients[clientID];
    this._clientsCount--;
	
	util.log("  -C " + clientID + " [" + this._clientsCount + "]");
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