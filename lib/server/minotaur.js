var util = require("util"), 
    http = require("http"),
    url = require("url"),
    qs = require("querystring"),
    uuid = require("./node-uuid/uuid"),
    Client = require("./Client");
    //Manager = require("./Manager");
    
/*------------------------------------------------------------------------------
  (public) Minotaur
  
  + options - { 
        pollTimeout, 
        subdomainPool,
        server
    }
  - void
  
  Set up Minotaur server.
------------------------------------------------------------------------------*/
var Minotaur = module.exports = function Minotaur(options) {
    // browser sessions store
    this._sessions = {};
    
    // total number of active sessions
    this._sessionsCount = 0;
    
    // clients store
	this._clients = {};
    
    // total number of actively connected clients
	this._clientsCount = 0;
    
    // total number of clients which were ever connected
	this._clientsCountEver = 0;

    // message queue send timeout
    this._TICK_TIMEOUT = 250;

    // long poll timeout
    this._POLL_TIMEOUT = options.pollTimeout || 5000;
    
    // long poll timeout in ticks (1 tick is ~250ms), -2 is network latency
    this._POLL_TIMEOUT_IN_TICKS = (this._POLL_TIMEOUT / 250) - 2;
    
    // cookie to identify the same browser context
	this._SESSION_COOKIE = "__MINSID";
    
    // pool of subdomains to overcome browser parallel connections limit
    this._subdomainPool = options.subdomainPool;
    
    // http server
    this._httpServer = options.server;
};

Minotaur.prototype = new process.EventEmitter();

/*------------------------------------------------------------------------------
  (public) clientsCount
  
  - get

  Getter for total number of active clients connected to minotaur server.
------------------------------------------------------------------------------*/
Object.defineProperty(Minotaur.prototype, "clientsCount", {
    get: function() {
        return this._clientsCount;
    }
});

/*------------------------------------------------------------------------------
  (public) sessionsCount
  
  - get

  Getter for total number of active sessions.
------------------------------------------------------------------------------*/
Object.defineProperty(Minotaur.prototype, "sessionsCount", {
    get: function() {
        return this._sessionsCount;
    }
});

/*------------------------------------------------------------------------------
  (private) _tickInterval
  
  + none
  - void
  
  Periodically loops through all active sessions and its clients, send queued 
  messages and increments each client.
------------------------------------------------------------------------------*/
Minotaur.prototype._tickInterval = function() {
	var self = this,
		responseObject = [],
        item, client;

	setTimeout(function () {
		for(item in self._clients) {
            client = self._clients[item];
        
            if(client && client.response && client.isPollReady) {
                // if there are messages to be sent - send them and clear buffer
                // else - send response for next poll when client "ticked" 
				// certain number of times (4 ticks should equal to ~1 second)
                if(client.messageBuffer.length > 0) {
                    client.isPollReady = false;
                    self._sendResponse(
                        client.response, 
                        client.messageBuffer,
                        client.jsonpCallback
                    );
                    client.response = undefined;
                    client.messageBuffer = [];
                } else {
                    if(client.ticks > self._POLL_TIMEOUT_IN_TICKS) {
                        client.isPollReady = false;
                        self._sendResponse(
                            client.response, 
                            [{cmd: "poll"}],
                            client.jsonpCallback
                        );
                        client.response = undefined;
                    }
                }
                
                client.ticks += 1;
            }
        }

		self._tickInterval();
	}, self._TICK_TIMEOUT);
};

/*------------------------------------------------------------------------------
  (private) _disconnectionInterval
  
  + none
  - void
  
  Periodical interval for disconnecting clients which were left with opened 
  connection. This situation may happen when user closes tab or browser at
  the time of assigning new poll request.
------------------------------------------------------------------------------*/
Minotaur.prototype._disconnectionInterval = function() {
	var self = this,
        expiration, item, session, client;

	setTimeout(function () {
        expiration = new Date().getTime() - 120000;
        //util.log("disconnection interval");
    
		for(item in self._clients) {
            client = self._clients[item];
        
            //util.log("disconnection interval loop client " + client.id + " timestamp " + client.timestamp + " expiration " + expiration);
        
            if(client && (client.timestamp < expiration)) {
                session = self._sessions[client.sessionID];
            
                //util.log("disconnection interval " + session.id);
            
                if(session) {
                    //util.log("close hanger " + client.id);
            
                    // if there is subdomain pool - free assigned subdomain
                    if(self._subdomainPool) {
                        self._freeSubdomain(session.id, client.subdomain);
                    }
                    
                    // remove this client from session clients
                    session.clients.splice(
                        session.clients.indexOf(client.id), 
                        1
                    );
                    
                    // if there are no clients left - delete session
                    if(session.clients.length === 0) {
                        delete self._sessions[session.id];
                        self._sessionsCount--;
                    }
                    
                    // raise client disconnect event and delete him
                    self._clientsCount--;
                    client.disconnect("hanged");
                    delete self._clients[client.id];
                }
            }
        }

		self._disconnectionInterval();
	}, 120000);
};

/*------------------------------------------------------------------------------
  (private) _connect
  
  + request - incoming http request
  + response - outgoing http response
  + queryString - JSON representation of query string
  - void
  
  Processes incoming connection from new client.
------------------------------------------------------------------------------*/
Minotaur.prototype._connect = function(request, response, queryString) {
    var sessionID = this._getIdFromCookie(this._SESSION_COOKIE, request),
        responseObject = [],
        host = request.headers.host,
		domain = host.substring(host.indexOf(".")),
        baseDomain, session, assignedSubdomain, clientID, client;
    
    // if cookie with session ID was found - check if session object exist
    // else - create new session ID and session object
    if(sessionID) {
        session = this._sessions[sessionID];
    
        // if session is found - ok
        // else - create new session object
        if(session) {
            //util.log("SID and session exist " + sessionID);
        } else {
            session = { id: uuid(), clients: [], subdomains: [] };
            this._sessions[session.id] = session;
            this._sessionsCount++;
            //util.log("Invalid SID, new sid and session created " + session.id);
        }
    } else {
        session = { id: uuid(), clients: [], subdomains: [] };
        this._sessions[session.id] = session;
        this._sessionsCount++;
        //util.log("New SID and session created " + session.id);
    }
    
    if(session && session.id) {
        // if subdomain pool exist - fresh poll subdomain
        // else - assign host address for polling
        if(this._subdomainPool) {
            assignedSubdomain = this._assignSubdomain(session.id);
        } else {
            assignedSubdomain = host;
        }
        session.subdomains.push(assignedSubdomain);
    
        //util.log("Assigned subdomain: " + assignedSubdomain);
    
        // create new client
        client = new Client(
            uuid(), 
            session.id, 
            assignedSubdomain, 
            request
        );
        
        // save received query string parameters to client data object - this
        // can be later used for checking credentials sent during connection
        client.data = queryString;
        
        this._clients[client.id] = client;
        this._clientsCount++;
        this._clientsCountEver++;
        
        // bound newly created client to session
        session.clients.push(client.id);
        
        // emit event about new connected client
        this.emit("connect", client);
        
        // parse only base format of the domain (domain.xyz)
        if(domain.indexOf(":") === -1) {
            baseDomain = domain.substring(1);
        } else {
            baseDomain = domain.substring(1, domain.indexOf(":"));
        }

        // set session cookie
        response.setHeader(
            "Set-Cookie", 
            "" + this._SESSION_COOKIE + "=" + session.id + "; " +
            "domain=" + baseDomain + "; HttpOnly"
        );
        
        responseObject.push({
			cmd: "con_ok",
            payload: {
                clientID: client.id,
                pollDomain: assignedSubdomain + domain
            }
        });
    } else {
        responseObject.push({
            cmd: "con_err", 
            payload: {
                message: "invalid session ID, session or subdomain"
            }
        });
    }    
    
    this._sendResponse(response, responseObject, queryString.callback);
};

/*------------------------------------------------------------------------------
  (private) _poll
  
  + request - incoming http request
  + response - outgoing http response
  + queryString - JSON representation of query string
  - void
  
  Processes client (long) polling.
------------------------------------------------------------------------------*/
Minotaur.prototype._poll = function(request, response, queryString) {	
	var self = this,
        sessionID = this._getIdFromCookie(this._SESSION_COOKIE, request),
        session = this._sessions[sessionID],
        client = this._clients[queryString.clientID],
        responseObject = [];
    
    // if session and client object exist - assign new poll objects
    // else - send poll error message
    if(session && client) {
        client.request = request;
        client.response = response;
        client.timestamp = new Date().getTime();
        client.isPollReady = true;
        client.ticks = 0;
        client.jsonpCallback = queryString.callback;
        
        // handle client disconnection
        client.request.on("close", function(reason) {
            //util.log("close " + client.id);
            self._disconnect(client.id, reason);
        });
    } else {
        responseObject.push({
            cmd: "poll_err", 
            payload: {
                message: "invalid session ID, session or client"
            }
        });
        
        this._sendResponse(response, responseObject, queryString.callback);
    }
};

/*------------------------------------------------------------------------------
  (private) _message
  
  + request - incoming http request
  + response - outgoing http respone
  + queryString - JSON representation of query string
  - void
  
  Processes incoming message from client.
------------------------------------------------------------------------------*/
Minotaur.prototype._message = function(request, response, queryString) {	
	var responseObject = [],
        sessionID = this._getIdFromCookie(this._SESSION_COOKIE, request),
        session = this._sessions[sessionID],
        client = this._clients[queryString.clientID],
		message = {}, 
        field;

    if(session && client) {        
        for(field in queryString) {
            if(queryString.hasOwnProperty(field)) {
                message[field] = this._sanitize(queryString[field]);
            }
        }
        
        client.receiveMessage(message);
        
		responseObject.push({cmd: "mess_ok"});
    } else {
		responseObject.push({cmd: "mess_err"});
    }

	this._sendResponse(response, responseObject, queryString.callback);
};

/*------------------------------------------------------------------------------
  (private) _disconnect
  
  + clientID
  + reason
  - void
  
  Disconnect client.
------------------------------------------------------------------------------*/
Minotaur.prototype._disconnect = function(clientID, reason) {	
	var client = this._clients[clientID],
        session = this._sessions[client.sessionID];

    if(client && session) {
        // if there is subdomain pool - free assigned subdomain
        if(this._subdomainPool) {
            this._freeSubdomain(session.id, client.subdomain);
        }
        
        // remove this client from session clients
        session.clients.splice(session.clients.indexOf(client.id), 1);
        
        // if there are no clients left - delete session
        if(session.clients.length === 0) {
            delete this._sessions[session.id];
            this._sessionsCount--;
        }
        
        // raise client disconnect event and delete him
        this._clientsCount--;
        client.disconnect(reason);
        delete this._clients[client.id];
    }
};

/*------------------------------------------------------------------------------
  (private) _getIdFromCookie
  
  + cookieName
  + request
  - ID - return identifier if it was found in a cookie (otherwise undefined)
  
  Parse ID from a cookie.
------------------------------------------------------------------------------*/
Minotaur.prototype._getIdFromCookie = function(cookieName, request) {
    var regex, match, id;
    
    if(request.headers.cookie) {
        regex = new RegExp(cookieName + "=([^ ,;]*)");
        match = request.headers.cookie.match(regex);
        
        if (match) {
            id = match[1];
        }
    }
    
    return id;
};

/*------------------------------------------------------------------------------
  (private) _assignSubdomain
  
  + sessionID
  - subdomain - fresh subdomain for session from subdomain pool
  
  Returns fresh subdomain which could be assigned to particular session.
------------------------------------------------------------------------------*/
Minotaur.prototype._assignSubdomain = function(sessionID) {
    var session = this._sessions[sessionID],
        freshSubdomain, i, len, foundIndex;
    
    if(session && this._subdomainPool) {
        for(i = 0, len = this._subdomainPool.length; i < len; i++) {
            foundIndex = session.subdomains.indexOf(this._subdomainPool[i]);
            
            if(foundIndex === -1) {
                freshSubdomain = this._subdomainPool[i];
                break;
            }
        }
        
        if(freshSubdomain === undefined) {
            freshSubdomain = this._subdomainPool[0];
        }
    }
    
    return freshSubdomain;
};

/*------------------------------------------------------------------------------
  (private) _freeSubdomain
  
  + sessionID
  + subdomain
  - void
  
  Free subdomain previously assigned to specified session.
------------------------------------------------------------------------------*/
Minotaur.prototype._freeSubdomain = function(sessionID, subdomain) {
    var session = this._sessions[sessionID],
        foundIndex;
    
    if(session) {
        foundIndex = session.subdomains.indexOf(subdomain);
            
        if(foundIndex !== -1) {
            session.subdomains.splice(foundIndex, 1);
        }
    }
};

/*------------------------------------------------------------------------------
  (private) _sanitize
  
  + message - string to be sanitized
  - string - sanitized string
  
  Replace characters ('&', '<', '>') to prevent XSS.
------------------------------------------------------------------------------*/
Minotaur.prototype._sanitize = function(message) {
    return String(message)
        .replace(/&(?!\w+;)/g, '&amp;')
		.replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

/*------------------------------------------------------------------------------
  (private) _sendResponse
  
  + request - incoming http request
  + content - array of messages which will be sent in response
  + callbackName - name of the JSONP callback
  
  Send response to client with array of messages in JSONP format.
------------------------------------------------------------------------------*/
Minotaur.prototype._sendResponse = function(response, content, callbackName) {
	var jsonCallbackName = callbackName || "_jsnpcb";

	response.writeHead(200, {"Content-Type": "application/javascript"});
	response.write(
		jsonCallbackName + "(" + JSON.stringify({messages: content}) + ");", 
		"utf8"
	);
	response.end();
};

/*------------------------------------------------------------------------------
  (public) init
  
  + none
  - void
  
  Initialize minotaur server.
------------------------------------------------------------------------------*/
Minotaur.prototype.init = function() {
	var self = this;

	this._httpServer.addListener("request", function(request, response) {
		var path = url.parse(request.url).pathname;

		switch(path) {
			case "/minotaur_connect":
				self._connect(
					request, 
					response,
					url.parse(request.url, true).query
				);
				break;
			case "/minotaur_poll":
				self._poll(
					request, 
					response, 
					url.parse(request.url, true).query
				);
				break;
			/*case "/mindisc":
				self._disconnect(
					request, 
					response, 
					url.parse(request.url, true).query
				);
				break;*/
			case "/minotaur_message":
				self._message(
					request, 
					response, 
					url.parse(request.url, true).query
				);
				break;
			default:
				break;
		}
    });

	// start periodical tick interval
	self._tickInterval();
    // start periodical interval for disconnecting clients which were left with
    // opened connection for long period
	self._disconnectionInterval();
};

/*------------------------------------------------------------------------------
  (public) disconnect
  
  + clientID
  - void
  
  Disconnects particular client.
------------------------------------------------------------------------------*/
Minotaur.prototype.disconnect = function(clientID) {
    this._disconnect(clientID, "forced");
};

/*------------------------------------------------------------------------------
  (public) send
  
  + clientID
  + message
  - void
  
  Sends message to particular client.
------------------------------------------------------------------------------*/
Minotaur.prototype.send = function(clientID, message) {
    var client = this._clients[clientID];
    
    if(client) {
        client.queueMessage(message);
    }
};

/*------------------------------------------------------------------------------
  (public) broadcast
  
  + message - object to be broadcasted
  + exceptCID - client which should be excluded from broadcast
  - void
  
  Broadcasts passed message to all connected clients except one if specified.
------------------------------------------------------------------------------*/
Minotaur.prototype.broadcast = function(message, exceptCID) {
    var client, item;

    for(item in this._clients) {
        client = this._clients[item];
        
        if(client) {
            if(exceptCID) {
                if (client.id !== exceptCID) {
                    client.queueMessage(message);
                }
            } else {
                client.queueMessage(message);
            }
        }
    }
};