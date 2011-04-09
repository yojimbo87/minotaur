var util = require("util"),
    Uuid = require("./node-uuid/uuid.js"),
 Session = require("./session");
 
/*------------------------------------------------------------------------------
  Module constructor
------------------------------------------------------------------------------*/
 
var Manager = module.exports = function Manager(httpServer) {
	// hash list of active sessions
	this._sessions = {};
	// total number of active sessions
	this._sessionsCount = 0;
};

/*------------------------------------------------------------------------------
  Properties
------------------------------------------------------------------------------*/

Object.defineProperty(Manager.prototype, "sessionsCount", {
    get: function() {
        return this._sessionsCount;
    }
});

/*------------------------------------------------------------------------------
  Public methods
------------------------------------------------------------------------------*/

Manager.prototype.attachSession = function(response) {
    var session = new Session(Uuid());

    session.attachClient(response);
    
    this._sessions[session.sid] = session;
    this._sessionsCount++;
    //debug("Attached", session.sid, this._count);
	util.log("+S " + session.sid + " [" + this._sessionsCount + "]");

    return session;
};

Manager.prototype.detachSession = function(sessionID) {
    delete this._sessions[sessionID];
    this._sessionsCount--;
    //debug("Detached", sessionID, this._count);
	util.log("-S " + sessionID + " [" + this._sessionsCount + "]");
};

Manager.prototype.getSession = function(sessionID) {
    return this._sessions[sessionID];
};

/*Manager.prototype.assignPollDomain = function(sessionID) {
	var clients = this._sessions[sessionID].clients,
		item,
		pollDomainIndex;
	
	for(item in clients) {
        if(clients[item]
    }
	
	return pollDomain;
};*/

/*Manager.prototype.forEachSession = function(callback) {
    for(var item in this._sessions) {
        callback(this._sessions[item]);
    }
};*/