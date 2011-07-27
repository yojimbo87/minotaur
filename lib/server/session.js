var util = require("util"),
    Uuid = require("./node-uuid/uuid.js");

/*------------------------------------------------------------------------------
  (public) Session
  
  + sessionID - session identificator
  - void
  
  Set up session.
------------------------------------------------------------------------------*/
var Session = module.exports = function Session(sessionID) {	
	// unique ID of the session
    this._sid = sessionID;
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
  (public) sid
  
  - get

  Getter for session identificator.
------------------------------------------------------------------------------*/
Object.defineProperty(Session.prototype, "sid", {
    get: function() {
        return this._sid;
    }
});

/*------------------------------------------------------------------------------
  (public) clients
  
  - get

  Getter for active clients bound to this session.
------------------------------------------------------------------------------*/
Object.defineProperty(Session.prototype, "clients", {
    get: function() {
        return this._clients;
    }
});

/*------------------------------------------------------------------------------
  (public) clientsCount
  
  - get

  Getter for total number of active clients bound to this session.
------------------------------------------------------------------------------*/
Object.defineProperty(Session.prototype, "clientsCount", {
    get: function() {
        return this._clientsCount;
    }
});

/*------------------------------------------------------------------------------
  (public) data
  
  - get
  - set

  Getter and setter additional data bound to this session.
------------------------------------------------------------------------------*/
Object.defineProperty(Session.prototype, "data", {
    get: function() {
        return this._data;
    },
    set: function(value) {
        this._data = value;
    }
});

/*------------------------------------------------------------------------------
  (public) lastAssignedClientID
  
  - get

  Getter for client ID which was assigned last time to this session.
------------------------------------------------------------------------------*/
Object.defineProperty(Session.prototype, "lastAssignedClientID", {
    get: function() {
        return this._lastAssignedClientID;
    }
});

/*------------------------------------------------------------------------------
  (public) lastAssignedPollDomain
  
  - get

  Getter for client poll domain which was assigned last time to this session.
------------------------------------------------------------------------------*/
Object.defineProperty(Session.prototype, "lastAssignedPollDomain", {
    get: function() {
        return this._lastAssignedPollDomain;
    }
});

/*------------------------------------------------------------------------------
  (public) attachClient

  + response - http response
  + pollDomain - unique (long) poll domain for this client
  - void
  
  Attaches new client to this session and emit client event.
------------------------------------------------------------------------------*/	
Session.prototype.attachClient = function(response, pollDomain) {
	var client = {
		id: Uuid(),
        response: null,
        timestamp: new Date().getTime(),
		pollDomain: pollDomain,
		messageBuffer: [],
		ticks: 0,
		isPollReady: true,
		data: {}
	};
	
    this._clients[client.id] = client;
    this._clientsCount++;
	this._lastAssignedClientID = client.id;
	this._lastAssignedPollDomain = client.pollDomain;
	
	this.emit("clientConnect", client.id);
};

/*------------------------------------------------------------------------------
  (public) detachClient

  + clientID - client identificator
  - void
  
  Detaches specified client from this session.
------------------------------------------------------------------------------*/
Session.prototype.detachClient = function(clientID) {
    delete this._clients[clientID];
    this._clientsCount--;
	
	this.emit("clientDisconnect", clientID);
};

/*------------------------------------------------------------------------------
  (public) getClient

  + clientID - client identificator
  - client - client object
  
  Get specified client which belongs to this session.
------------------------------------------------------------------------------*/
Session.prototype.getClient = function(clientID) {
    return this._clients[clientID];
};

/*------------------------------------------------------------------------------
  (public) forEachClient

  + callback - callback for each found client
  - void
  
  Enumerates through clients which belongs to this session.
------------------------------------------------------------------------------*/
Session.prototype.forEachClient = function(callback) {
	var item;

    for(item in this._clients) {
        if(this._clients.hasOwnProperty(item)) {
			callback(this._clients[item]);
		}
    }
};

/*------------------------------------------------------------------------------
  (public) receiveMessage

  + message - message object which this session received
  - void
  
  Emits message event passing the message object.
------------------------------------------------------------------------------*/
Session.prototype.receiveMessage = function(message) {
    this.emit("message", message);
};

/*------------------------------------------------------------------------------
  (public) disconnect

  + none
  - void
  
  Emits disconnect event.
------------------------------------------------------------------------------*/
Session.prototype.disconnect = function() {
    this.emit("disconnect");
};

/*------------------------------------------------------------------------------
  (public) queueMessage

  + message - message object which will be queued
  + clientID - specific client ID to which should be message sent
  - void
  
  Queue message into each client buffer.
------------------------------------------------------------------------------*/
Session.prototype.queueMessage = function(message, clientID) {
	var item, client;

	// if clientID is not undefined send message to particular client, otherwise
	// broadcast the message to each connected client of this session
	if(clientID) {
		client = this._clients[clientID];
		
		if(client && client.messageBuffer) {
			client.messageBuffer.push(message);
		}
	} else {
		for(item in this._clients) {
			client = this._clients[item];
			
			if(client && client.messageBuffer) {
				client.messageBuffer.push(message);
			}
		}
	}
};