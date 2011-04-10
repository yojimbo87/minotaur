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
	// pool for assignement of unique subdomain to each polling client
	this._DOMAIN_POOL = [
		"rt01.developmententity.sk",
		"rt02.developmententity.sk",
		"rt03.developmententity.sk",
		"rt04.developmententity.sk",
		"rt05.developmententity.sk",
		"rt06.developmententity.sk",
		"rt07.developmententity.sk",
		"rt08.developmententity.sk",
		"rt09.developmententity.sk",
		"rt10.developmententity.sk",
		"rt11.developmententity.sk",
		"rt12.developmententity.sk",
		"rt13.developmententity.sk",
		"rt14.developmententity.sk",
		"rt15.developmententity.sk",
		"rt16.developmententity.sk",
		"rt17.developmententity.sk",
		"rt18.developmententity.sk",
		"rt19.developmententity.sk",
		"rt20.developmententity.sk"
	];
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

    session.attachClient(response, this._DOMAIN_POOL[0]);
    
    this._sessions[session.sid] = session;
    this._sessionsCount++;

	util.log("+S " + session.sid + " [" + this._sessionsCount + "]");

    return session;
};

Manager.prototype.detachSession = function(sessionID) {
    delete this._sessions[sessionID];
    this._sessionsCount--;

	util.log("-S " + sessionID + " [" + this._sessionsCount + "]");
};

Manager.prototype.getSession = function(sessionID) {
    return this._sessions[sessionID];
};

/*Manager.prototype.forEachSession = function(callback) {
    for(var item in this._sessions) {
        callback(this._sessions[item]);
    }
};*/

Manager.prototype.assignPollDomain = function(sessionID) {
	var clients = this.getSession(sessionID).clients,
		usedDomains = [],
		itemClient,
		itemDomain,
		pollDomain;

	if(clients) {
		// load actually used poll domains
		for(itemClient in clients) {
			usedDomains.push(clients[itemClient].pollDomain);
		}
		// assign free poll domain
		for(itemDomain in this._DOMAIN_POOL) {
			if(!this._contains(usedDomains, this._DOMAIN_POOL[itemDomain])) {
				pollDomain = this._DOMAIN_POOL[itemDomain];
			}
		}
		// if all of them are used, asign first
		if(!pollDomain) {
			pollDomain = this._DOMAIN_POOL[0];
		}
	}

	return pollDomain;
};

/*------------------------------------------------------------------------------
  Private methods
------------------------------------------------------------------------------*/

Manager.prototype._contains = function(array, object) {
	var len = array.length,
		i;
	for(i = 0; i < len; i++) {
		if (array[i] === object) {
			return true;
		}
	}
	
	return false;
};