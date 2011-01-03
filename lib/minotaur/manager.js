var sys = require("sys"),
   uuid = require("../node-uuid/uuid"),
    ses = require("./session");

var debug;

/*-----------------------------------------------
  Connection Manager
-----------------------------------------------*/
module.exports = Manager;

function Manager(showDebug) {
    if(showDebug) {
        debug = function() {
            sys.log("\033[31mManager: " + 
            Array.prototype.join.call(arguments, ", ") + 
            "\033[39m"); 
        };
    } else {
        debug = function(){};
    }
    
    // sessions count
    this._count = 0;
    this._sessions = {};
};

Object.defineProperty(Manager.prototype, "count", {
    get: function() {
        return this._count;
    }
});

Manager.prototype.attachSession = function(response) {
    var session = new ses(uuid());

    session.attachClient(uuid(), response);
    
    this._sessions[session.sid] = session;
    this._count++;
    debug("Attached", session.sid, this._count);

    return session;
};

Manager.prototype.detachSession = function(sessionID) {
    delete this._sessions[sessionID];
    this._count--;
    debug("Detached", sessionID, this._count);
};

Manager.prototype.getSession = function(sessionID) {
    return this._sessions[sessionID];
};

Manager.prototype.forEachSession = function(callback) {
    for(var item in this._sessions) {
        callback(this._sessions[item]);
    }
};

Manager.prototype.sendResponse = function(response, content, cookieName, sessionID) {
	if(cookieName && sessionID) {
	    response.setSecureCookie(cookieName, sessionID, { httpOnly: true });    
	}
	
	response.writeHead(200, {"Content-Type": "text/javascript"});
	response.write("_jqjsp(" + JSON.stringify(content) + ")", "utf8");
	response.end();
};
