var sys = require("sys");

/*-----------------------------------------------
  Connection
-----------------------------------------------*/
module.exports = Connection;

function Connection(id, res) {  
    this._sessionID = id;
    // http response object
    this._response = res;
    // setTimeout handler
    this._heartbeat = null;
    // timestamp to determine amount of time between last poll
    this._timestamp = new Date().getTime();
    // messages to be sent in the next interval
    this._messageBuffer = [];
    // connectio status: init, ready, wait
    this._status = "init";
};

Object.defineProperty(Connection.prototype, "id", {
    get: function() {
        return this._sessionID;
    }
});

Object.defineProperty(Connection.prototype, "response", {
    get: function() {
        return this._response;
    },
    set: function(val) {
        this._response = val;
        this._status = "ready";
        // new poll timeout begins
        this._timestamp = new Date().getTime();
    }
});

Object.defineProperty(Connection.prototype, "heartbeat", {
    get: function() {
        return this._heartbeat;
    },
    set: function(val) {
        this._heartbeat = val;
    }
});

Object.defineProperty(Connection.prototype, "timestamp", {
    get: function() {
        return this._timestamp;
    }
});

Object.defineProperty(Connection.prototype, "messageBuffer", {
    get: function() {
        return this._messageBuffer;
    },
    set: function(val) {
        this._messageBuffer = val;
    }
});

Object.defineProperty(Connection.prototype, "status", {
    get: function() {
        return this._status;
    },
    set: function(val) {
        this._status = val;
    }
});

Connection.prototype.send = function(message) {
    // stop polling timeout
    if(this._heartbeat != null) {
        clearTimeout(this._heartbeat);
    }
    // queue message into buffer
    this._messageBuffer.push(message);
};