var sys = require("sys"),
 cookie = require("../cookie-node/cookie-node"),
    man = require("./manager");

var debug;
var manager = new man(true);
// signed cookie secret
cookie.secret = "ergqwnmjl-79-k2lgzc3jo-6itajkw5g4-51j74wegk5gl-kg3j6-hgewjgl";

/*-----------------------------------------------
  Minotaur implementation
-----------------------------------------------*/
module.exports = Server;

function Server(showDebug) {
    if(showDebug) {
        debug = function(){sys.log(
            "\033[31mMinotaur: " + 
            Array.prototype.join.call(arguments, ", ") + 
            "\033[39m"); 
        };
    } else {
        debug = function(){};
    }
    
    // counter for creating unique cookie names
    this._cookieCount = 1;
    this._expiration = null;
    this._expiredSessions = [];
    this._buffer = null;
    
    // periodic interval for sending messages in connection buffer to clients
    setInterval(function() {
        manager.forEach(function(connection) {
            if((connection.messageBuffer.length > 0) && (connection.status == "ready")) {
                connection.status = "wait";
                buffer = connection.messageBuffer;
                connection.messageBuffer = [];
                connection.response.writeHead(200, {"Content-Type": "text/javascript"});
                connection.response.write("_jqjsp(" + JSON.stringify(buffer) + ")", "utf8");
                connection.response.end();
            }
        });
    }, 250);
    
    // periodic interval for detachment of expired connections
    setInterval(function() {
        expiration = new Date().getTime() - 20000;
        expiredSessions = [];
        
        // detach expired sessions
        manager.forEach(function(connection) {
            if(connection.timestamp < expiration) {
                manager.detach(connection.id);
                expiredSessions.push(connection.id);
            }
        });
        
        // notify connected clients about disconnected connections
        manager.forEach(function(connection) {
            for(var i = 0; i < expiredSessions.length; i++) {
                connection.send({cmd: "out", id: expiredSessions[i]});
            }
        });
    }, 20000);
};

// process new client connection
Server.prototype.connect = function(res) {
    var sessionID = manager.createID();
    var cookieName = "rdm" + this._cookieCount;
    this._cookieCount++;
    
    // attach new connection
    manager.attach(sessionID, res);
    
    res.setSecureCookie(cookieName, sessionID);
    res.writeHead(200, {"Content-Type": "text/javascript"});
    res.write("_jqjsp(" + JSON.stringify({cookie: cookieName}) + ")", "utf8");
    res.end();
    
    return sessionID;
};

// process polling
Server.prototype.poll = function(req, res, qs) {
    //var qs = url.parse(req.url, true).query;
    if(qs && qs.cookie) {
        // get session ID from signed cookie
        var sessionID = req.getSecureCookie(qs.cookie);
        
        // if there is a session ID and command from query string is "poll":
        // find connection, assign new response object and long poll 
        // for another request
        if(sessionID && qs.cmd && (qs.cmd === "poll")) {
            manager.find(sessionID, function(connection) {
                connection.response = res;
                connection.status = "ready";
                connection.heartbeat = setTimeout(function() {
                    connection.send({cmd: "poll"});
                }, 5000);
            });
        }
    }
};

// process delivered message
Server.prototype.message = function(req, res, qs, callback) {
    //var qs = url.parse(req.url, true).query;
    if(qs && qs.cookie) {
        // get session ID from signed cookie
        var sessionID = req.getSecureCookie(qs.cookie);
        
        // if there is a session ID, command from query string is "msg",
        // query string contains id and content parameters: find connection, 
        // sanitize content, send it and response with "ok"
        if(sessionID && qs.cmd && (qs.cmd === "msg") && qs.content) {
            manager.find(sessionID, function(connection) {
                var sanitizedContent = qs.content.replace(/</g, "&lt;")
                sanitizedContent = sanitizedContent.replace(/>/g, "&gt;");
                callback(connection.id, sanitizedContent);
            });
            
            res.writeHead(200, {"Content-Type": "text/javascript"});
            res.write("_jqjsp(" + JSON.stringify({ok: "ok"}) + ")", "utf8");
            res.end();
        }
    }
};

// broadcast message to each connected client except certain id if specified
Server.prototype.broadcast = function(message, id) {
    if(id) {
	    manager.forEach(function(connection) {
	        if(connection.id != id) {
	            connection.send(message);
	        }
	    });
    } else {
        manager.forEach(function(connection) {
            connection.send(message);
        });
    }
};

// send message to specified id
Server.prototype.send = function(id, message) {
    manager.find(id, function(connection) {
        connection.send(message);
    });
};

// get connected client IDs
Server.prototype.connections = function() {
    var connections = [];
        
    manager.forEach(function(connection) {
        connections.push(connection.id);
    });
    
    return connections;
};
