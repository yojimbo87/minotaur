var util = require("util");

/*------------------------------------------------------------------------------
  (public) Client
  
  + clientID
  + subdomain - subdomain on which this client is polling
  + request
  + response
  - void
  
  Set up client.
------------------------------------------------------------------------------*/
var Client = module.exports = function Client(cid, sid, subdomain, req) {	
    this._id = cid;
    this._sessionID = sid;
	this._subdomain = subdomain;
    this._request = req;
    this._response = undefined;
    
    this._timestamp = new Date().getTime();
    // flag for preventing messages being sent when there is no response object
    this._isPollReady = true;
    this._ticks = 0;
    this._jsonpCallback = "";
    
    // buffer of messages which will be sent in next poll tick
    this._messageBuffer = [];
    
    // storage for extra data within this client
    this._data = undefined;
};

Client.prototype = new process.EventEmitter();

/*------------------------------------------------------------------------------
  (public) id
  
  - get

  Getter for client identifier.
------------------------------------------------------------------------------*/
Object.defineProperty(Client.prototype, "id", {
    get: function() {
        return this._id;
    }
});

/*------------------------------------------------------------------------------
  (public) sessionID
  
  - get

  Getter session ID of this client.
------------------------------------------------------------------------------*/
Object.defineProperty(Client.prototype, "sessionID", {
    get: function() {
        return this._sessionID;
    }
});

/*------------------------------------------------------------------------------
  (public) subdomain
  
  - get

  Getter for client poll subdomain.
------------------------------------------------------------------------------*/
Object.defineProperty(Client.prototype, "subdomain", {
    get: function() {
        return this._subdomain;
    }
});

/*------------------------------------------------------------------------------
  (public) request
  
  - get
  - set

  Getter and setter for client request object.
------------------------------------------------------------------------------*/
Object.defineProperty(Client.prototype, "request", {
    get: function() {
        return this._request;
    },
    set: function(value) {
        this._request = value;
    }
});

/*------------------------------------------------------------------------------
  (public) response
  
  - get
  - set

  Getter and setter for client response object.
------------------------------------------------------------------------------*/
Object.defineProperty(Client.prototype, "response", {
    get: function() {
        return this._response;
    },
    set: function(value) {
        this._response = value;
    }
});

/*------------------------------------------------------------------------------
  (public) timestamp
  
  - get
  - set

  Getter and setter for client timestamp.
------------------------------------------------------------------------------*/
Object.defineProperty(Client.prototype, "timestamp", {
    get: function() {
        return this._timestamp;
    },
    set: function(value) {
        this._timestamp = value;
    }
});

/*------------------------------------------------------------------------------
  (public) isPollReady
  
  - get
  - set

  Getter and setter for client poll ready status.
------------------------------------------------------------------------------*/
Object.defineProperty(Client.prototype, "isPollReady", {
    get: function() {
        return this._isPollReady;
    },
    set: function(value) {
        this._isPollReady = value;
    }
});

/*------------------------------------------------------------------------------
  (public) ticks
  
  - get
  - set

  Getter and setter for client ticks count.
------------------------------------------------------------------------------*/
Object.defineProperty(Client.prototype, "ticks", {
    get: function() {
        return this._ticks;
    },
    set: function(value) {
        this._ticks = value;
    }
});

/*------------------------------------------------------------------------------
  (public) jsonpCallback
  
  - get
  - set

  Getter and setter for client jsonp callback name.
------------------------------------------------------------------------------*/
Object.defineProperty(Client.prototype, "jsonpCallback", {
    get: function() {
        return this._jsonpCallback;
    },
    set: function(value) {
        this._jsonpCallback = value;
    }
});

/*------------------------------------------------------------------------------
  (public) messageBuffer
  
  - get
  - set

  Getter and setter for message buffer of this client.
------------------------------------------------------------------------------*/
Object.defineProperty(Client.prototype, "messageBuffer", {
    get: function() {
        return this._messageBuffer;
    },
    set: function(value) {
        this._messageBuffer = value;
    }
});

/*------------------------------------------------------------------------------
  (public) data
  
  - get
  - set

  Getter and setter for additional data bound to this client.
------------------------------------------------------------------------------*/
Object.defineProperty(Client.prototype, "data", {
    get: function() {
        return this._data;
    },
    set: function(value) {
        this._data = value;
    }
});

/*------------------------------------------------------------------------------
  (public) receiveMessage

  + message - message object which client received
  - void
  
  Emit message event passing the message object.
------------------------------------------------------------------------------*/
Client.prototype.receiveMessage = function(message) {
    this.emit("message", message);
};

/*------------------------------------------------------------------------------
  (public) queueMessage

  + message - object which will be queued
  - void
  
  Queue message into each client buffer.
------------------------------------------------------------------------------*/
Client.prototype.queueMessage = function(message) {
	this._messageBuffer.push(message);
};

/*------------------------------------------------------------------------------
  (public) disconnect
  
  + reason
  - void
  
  Parse ID from a cookie.
------------------------------------------------------------------------------*/
Client.prototype.disconnect = function(reason) {
    if(reason === undefined) {
        reason = "disconnected";
    }

    this.emit("disconnect", reason);
};