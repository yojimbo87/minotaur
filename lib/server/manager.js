var util = require("util"),
    Uuid = require("./node-uuid/uuid.js"),
 Session = require("./session");
 
/*------------------------------------------------------------------------------
  (public) Manager
  
  + none
  - void
  
  Set up session manager for minotaur server.
------------------------------------------------------------------------------*/
var Manager = module.exports = function Manager(subdomainPool) {
	var item;
	// hash list of active sessions
	this._sessions = {};
	// total number of active sessions
	this._sessionsCount = 0;
	// pool for assignement of unique subdomain to each polling client
	this._DOMAIN_POOL = subdomainPool || [];
};

/*------------------------------------------------------------------------------
  (public) sessionsCount
  
  - get

  Getter for number of actively connected sessions.
------------------------------------------------------------------------------*/
Object.defineProperty(Manager.prototype, "sessionsCount", {
    get: function() {
        return this._sessionsCount;
    }
});

/*------------------------------------------------------------------------------
  (public) attachSession

  + response - http response
  + host - will be used for assigning unique poll subdomain
  - session - object representing newly attached session
  
  Attaches new session for managing.
------------------------------------------------------------------------------*/
Manager.prototype.attachSession = function(response, host) {
    var session = new Session(Uuid());

	if(this._DOMAIN_POOL.length === 0) {
		session.attachClient(response, host);
	} else {
		session.attachClient(
			response, 
			this._DOMAIN_POOL[0] + host.substring(host.indexOf("."))
		);
	}
    
    this._sessions[session.sid] = session;
    this._sessionsCount++;

	util.log("+S " + session.sid + " [" + this._sessionsCount + "]");

    return session;
};

/*------------------------------------------------------------------------------
  (public) detachSession

  + sessionID - session identificator
  - void
  
  Detaches session from manager.
------------------------------------------------------------------------------*/
Manager.prototype.detachSession = function(sessionID) {
    delete this._sessions[sessionID];
    this._sessionsCount--;

	util.log("-S " + sessionID + " [" + this._sessionsCount + "]");
};

/*------------------------------------------------------------------------------
  (public) getSession

  + sessionID - session identificator
  - session - found session object
  
  Get particular session from manager based on it's ID.
------------------------------------------------------------------------------*/
Manager.prototype.getSession = function(sessionID) {
    return this._sessions[sessionID];
};

/*------------------------------------------------------------------------------
  (public) forEachSession

  + callback - callback for each found session
  - void
  
  Enumerates through actively managed sessions.
------------------------------------------------------------------------------*/
Manager.prototype.forEachSession = function(callback) {
	var item;

    for(item in this._sessions) {
		if(this._sessions.hasOwnProperty(item)) {
			callback(this._sessions[item]);
		}
    }
};

/*------------------------------------------------------------------------------
  (public) assignPollDomain

  + sessionID - session identificator
  - pollDomain - unique URL for polling
  
  Assign unique poll domain from subdomain pool to overcome web browsers 
  parallel connection limits.
------------------------------------------------------------------------------*/
Manager.prototype.assignPollDomain = function(sessionID, host) {
	var clients = this.getSession(sessionID).clients,
		usedDomains = [],
		pollDomain,
		item,
		itemClient,
		itemDomain;

	if(this._DOMAIN_POOL.length === 0) {
		return host;
	}
		
	if(clients) {
		// load actually used poll domains
		for(itemClient in clients) {
			usedDomains.push(clients[itemClient].pollDomain);
		}
		// assign free poll host
		for(itemDomain in this._DOMAIN_POOL) {
			item = this._DOMAIN_POOL[itemDomain] + 
				   host.substring(host.indexOf("."));
			if(!this._contains(usedDomains, item)) {
				pollDomain = item;
			}
		}
		// if all of them are used, asign first
		if(!pollDomain) {
			pollDomain = this._DOMAIN_POOL[0] + 
						 host.substring(host.indexOf("."));
		}
	}

	return pollDomain;
};

/*------------------------------------------------------------------------------
  (private) _contains

  + array - input array which will be searched
  + object - object to be searched for
  - bool - indicate if object was or wasn't found inside array
  
  Search for a presence of object inside array.
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