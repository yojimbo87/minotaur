var sys = require("sys"),
    url = require("url"),
 cookie = require("../cookie-node/cookie-node"),
   uuid = require("../node-uuid/uuid"),
    man = require("./manager");
   
var debug;
var manager = new man();
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
            "\033[36m" + 
            Array.prototype.join.call(arguments, ", ") + 
            "\033[39m"); 
        };
    } else {
        debug = function(){};
    }
    
    this._httpServer = httpServer;
    this._cookieName = "ssc";
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
                    if(client.response) {
		                client.response.writeHead(200, {"Content-Type": "text/javascript"});
		                client.response.write("_jqjsp(" + JSON.stringify({messages: buffer}) + ")", "utf8");
		                client.response.end();
                    }
                });
            }
        });
    }, 250);
    
    // periodic interval for detachment of expired clients and sessions
    setInterval(function() {
        var expiration = new Date().getTime() - 30000;
        
        manager.forEachSession(function(session) {
            session.forEachClient(function(client) {
                if(client.timestamp < expiration) {
                    session.detachClient(client.id);
                    debug(session.sid, "- (" + session.clientsCount + ")");
                }
            });
            
            if(session.clientsCount == 0) {
                session.disconnect();
                manager.detachSession(session.sid);
                debug(session.sid + " expired [" + manager.count + "]");
            }
        });
    }, 30000);
};

// add the EventEmitter to the object.
Server.prototype = process.EventEmitter();

Server.prototype.connect = function(request, response) {
    var clientID = null,
        session = null,
        sid = request.getSecureCookie(this._cookieName);
    
    // session doesn't exist: attach session and client witch signed cookie
    // session exist: attach client to existing session
    if(!sid) {
	    session = manager.attachSession(response);
        clientID = session.firstClientID;
        this.emit("connect", session);

        debug(session.sid + " [" + manager.count + "] new", "+ (" + session.clientsCount + ")");
    } else {
        session = manager.getSession(sid);
        
        // if session exists, but is no longer attached
        // this happens for example when user closed all client connections,
        // session expired and get detached but browser itself wasn't closed,
        // therefore cookie with sid still exists
        if(session) {
            clientID = uuid();

            session.attachClient(clientID, response);

            debug(session.sid + " [" + manager.count + "] reu", "+ (" + session.clientsCount + ")");
        } else {
            session = manager.attachSession(response);
            clientID = session.firstClientID;
            this.emit("connect", session);
            

            debug(session.sid + " [" + manager.count + "] exp", "+ (" + session.clientsCount + ")");
        }
    }

    // respond with assigned token
    response.setSecureCookie(this._cookieName, session.sid, { httpOnly: true });
    response.writeHead(200, {"Content-Type": "text/javascript"});
    response.write("_jqjsp(" + JSON.stringify({client: clientID}) + ")", "utf8");
	response.end();
};

Server.prototype.poll = function(request, response, queryString) {
    // get session ID from signed cookie
    var sid = request.getSecureCookie(this._cookieName);

    // find client within session which have particular ID and update its poll data
    if(sid && queryString && queryString.cmd && (queryString.cmd === "poll") && queryString.client) {
        var session = manager.getSession(sid);
        
        if(session) {
            var client = session.getClient(queryString.client)

            if(client) {
	            client.response = response;
	            client.timestamp = new Date().getTime();
			    client.heartbeat = setTimeout(function() {
			        client.response.writeHead(200, {"Content-Type": "text/javascript"});
			        client.response.write("_jqjsp(" + JSON.stringify({cmd: "poll"}) + ")", "utf8");
			        client.response.end();
			    }, 15000);
            }
        }
    }
};

// process delivered message
Server.prototype.message = function(request, response, queryString) {
    // get session ID from signed cookie
    var sid = request.getSecureCookie(this._cookieName);
    var sanitizedContent = "";

    // find session from which was message sent, sanitize content of message and respond with "ok"
    if(sid && queryString && queryString.cmd && (queryString.cmd === "msg") && queryString.content) {
        sanitizedContent = queryString.content.replace(/</g, "&lt;")
        sanitizedContent = sanitizedContent.replace(/>/g, "&gt;");
        
        var session = manager.getSession(sid);
        
        if(session) {
            session.receiveMessage(sanitizedContent);
        }
        
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
    manager.getSession(sid);
    
    if(session) {
        session.queueMessage(message);
    }
};

// get connected session IDs
Server.prototype.sessions = function() {
    var sessions = [];
        
    manager.forEachSession(function(session) {
        sessions.push(session.sid);
    });
    
    return sessions;
};