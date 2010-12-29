var sys = require("sys"),
    url = require("url"),
 cookie = require("../cookie-node/cookie-node"),
    man = require("./manager");

var debug;
var manager = new man(true);
// signed cookie secret
cookie.secret = "ergqwnmjl-79-k2lgzc3jo-6itajkw5g4-51j74wegk5gl-kg3j6-hgewjgl";

/*-----------------------------------------------
  Minotaur server implementation
-----------------------------------------------*/
module.exports = Server;

function Server(httpServer, showDebug) {
    var self = this;
    
    if(showDebug) {
        debug = function(){sys.log(
            "\033[31mMinotaur: " + 
            Array.prototype.join.call(arguments, ", ") + 
            "\033[39m"); 
        };
    } else {
        debug = function(){};
    }
    
    this._httpServer = httpServer;
    this._cookieName = "ssc";
    this._expiration = null;
    this._expiredSessions = [];

    // processing of requests for minotaur
    this._httpServer.addListener("request", function(request, response) {
        var path = url.parse(request.url).pathname;
        switch(path) {
            case "/connect":
                self.connect(request, response);
                break;
            case "/poll":
                self.poll(request, response, url.parse(request.url, true).query);
                break;
            case "/msg":
                self.message(request, response, url.parse(request.url, true).query);
                break;
            default:
                break;
        }
    });
    
    // periodic interval for sending messages in session buffer to connected clients
    setInterval(function() {
        manager.forEachSession(function(session) {
            if(session.messageBuffer.length > 0) {
                var buffer = session.messageBuffer;
                session.messageBuffer = [];
                
                session.forEachClient(function(client) {
                    client.response.writeHead(200, {"Content-Type": "text/javascript"});
                    client.response.write("_jqjsp(" + JSON.stringify({token: client.token, messages: buffer}) + ")", "utf8");
                    client.response.end();
                });
            }
        });
    }, 250);
    
    // periodic interval for detachment of expired clients and sessions
    setInterval(function() {
        expiration = new Date().getTime() - 20000;
        
        manager.forEachSession(function(session) {
            for(var index in session.clients) {
                if(session.clients[index].timestamp < expiration) {
                    session.detachClient(session.clients[index].token);
                }
            }
            
            if(session.clients.length == 0) {
                session.disconnect();
                manager.detachSession(session.sid);
            }
        });
    }, 20000);
};

// add the EventEmitter to the object.
Server.prototype = process.EventEmitter();

Server.prototype.connect = function(request, response) {
    var token = 0, 
        session = null,
        sid = request.getSecureCookie(this._cookieName);
    
    // session doesn't exist: attach session and client witch signed cookie
    // session exist: attach client to existing session
    if(!sid) {
	    sid = manager.createGUID();
	    
	    manager.attachSession(sid, response, function(newToken, attachedSession) {
	        token = newToken;
	        session = attachedSession;
	    });
        
        this.emit("connect", session);
        
        debug("New: " + sid, "clients: " + session.clients.length);
    } else {
        // flag if the sid exists, but is no longer attached
        // this happens for example when user closed all client connections,
        // session expired and get detached but browser itself wasn't closed,
        // therefore cookie with sid still exists
        var alreadyExist = false;
        
        manager.findSession(sid, function(foundSession) {
            alreadyExist = true;
            token = manager.createGUID();
            session = foundSession;
            foundSession.attachClient(token, response);
        });
        
        if(!alreadyExist) {
            sid = manager.createGUID();
            
            manager.attachSession(sid, response, function(newToken, attachedSession) {
                token = newToken;
                session = attachedSession;
            });
            
            this.emit("connect", session);
            
            debug("Exp: " + sid, "clients: " + session.clients.length);
        } else {
            
            debug("Reu: " + sid, "clients: " + session.clients.length);
        }
    }

    // respond with assigned token
    response.setSecureCookie(this._cookieName, sid, { httpOnly: true });
    response.writeHead(200, {"Content-Type": "text/javascript"});
    response.write("_jqjsp(" + JSON.stringify({token: token}) + ")", "utf8");
	response.end();
};

Server.prototype.poll = function(request, response, queryString) {
    // get session ID from signed cookie
    var sid = request.getSecureCookie(this._cookieName);
    
    // find client within session which have particular token and update its poll data
    if(sid && queryString && queryString.cmd && (queryString.cmd === "poll") && queryString.token) {
        manager.findSession(sid, function(session) {
            session.findClient(queryString.token, function(client) {
                client.token = manager.createGUID();
	            client.response = response;
	            client.timestamp = new Date().getTime();

	            client.heartbeat = setTimeout(function() {
	                client.response.writeHead(200, {"Content-Type": "text/javascript"});
	                client.response.write("_jqjsp(" + JSON.stringify({cmd: "poll", token: client.token}) + ")", "utf8");
	                client.response.end();
	            }, 5000);
            });
        });
    }
};

// process delivered message
Server.prototype.message = function(request, response, queryString/*, callback*/) {
    // get session ID from signed cookie
    var sid = request.getSecureCookie(this._cookieName);
    var sanitizedContent = "";
    
    // find session from which was message sent, sanitize content of message and respond with "ok"
    if(sid && queryString && queryString.cmd && (queryString.cmd === "msg") && queryString.content) {
        sanitizedContent = queryString.content.replace(/</g, "&lt;")
        sanitizedContent = sanitizedContent.replace(/>/g, "&gt;");
        
        manager.findSession(sid, function(session) {
            session.receiveMessage(sanitizedContent);
        });
        
        response.writeHead(200, {"Content-Type": "text/javascript"});
        response.write("_jqjsp(" + JSON.stringify({ok: "ok"}) + ")", "utf8");
        response.end();
    }
};

// broadcast message to each session clients except certain sid if specified
Server.prototype.broadcast = function(message, exceptSid) {
    if(exceptSid) {
	    manager.forEachSession(function(session) {
	        if(session.sid != exceptSid) {
	            session.queueMessage(message);
	        }
	    });
    } else {
        manager.forEachSession(function(session) {
            session.queueMessage(message);
        });
    }
};

// send message to specified id
Server.prototype.send = function(sid, message) {
    manager.findSession(sid, function(session) {
        session.queueMessage(message);
    });
};

// get connected session IDs
Server.prototype.sessions = function() {
    var sessions = [];
        
    manager.forEachSession(function(session) {
        sessions.push(session.sid);
    });
    
    return sessions;
};
