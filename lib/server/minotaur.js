var util = require("util"), 
	http = require("http"),
	 url = require("url"),
	  qs = require("querystring"),
    Uuid = require("./node-uuid/uuid.js"),
 Keygrip = require("./keygrip/keygrip.js")(["wege4t4", "32r324f", "43f3frgr"]),
 Cookies = require("./cookies/cookies.js"),
 Manager = require("./manager");

/*------------------------------------------------------------------------------
  (public) Minotaur
  
  + options
  - void
  
  Set up minotaur server.
------------------------------------------------------------------------------*/
var Minotaur = module.exports = function Minotaur(options) {	
	// http server
	this._httpServer = options.server;
	// session manager
	this._manager = new Manager(options.subdomainPool);
	// long poll timeout
	this._POLL_TIMEOUT = options.pollTimeout || 5000;
	// long poll timeout in ticks (1 tick is ~250ms), -2 is network latency
	this._POLL_TIMEOUT_IN_TICKS = (this._POLL_TIMEOUT / 250) - 2;
	// disconnection timeout
	this._DISCONNECT_TIMEOUT = options.disconnectTimeout || 15000;
	// message queue send timeout
	this._TICK_TIMEOUT = 250;
	// client side cookie name where will be stored session ID
	this._SESSION_COOKIE_NAME = options.sessionCookieName || "__mssc";
};

Minotaur.prototype = new process.EventEmitter();

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
			case "/connect":
				self._connect(request, response);
				break;
			case "/poll":
				self._poll(
					request, 
					response, 
					url.parse(request.url, true).query
				);
				break;
			case "/disc":
				self._disconnect(
					request, 
					response, 
					url.parse(request.url, true).query
				);
				break;
			case "/msg":
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
	
	// start periodical tick
	self._tickInterval();
	// start periodical check for timed out connections
	self._expirationInterval();
};

/*------------------------------------------------------------------------------
  (public) broadcast
  
  + message - object to be broadcasted
  + exceptSID - session which should be excluded from broadcast
  - void
  
  Broadcasts passed message to all connected sessions except one if present.
------------------------------------------------------------------------------*/
Minotaur.prototype.broadcast = function(message, exceptSID) {
	var self = this;

    if(exceptSID) {
	    self._manager.forEachSession(function(session) {
	        if(session.sid != exceptSID) {
	            session.queueMessage(message);
	        }
	    });
    } else {
        self._manager.forEachSession(function(session) {
            session.queueMessage(message);
        });
    }
};

/*------------------------------------------------------------------------------
  (public) send
  
  + sid - session ID to which the message should be sent
  + message - message to be sent
  - void
  
  Sends message to particular session.
------------------------------------------------------------------------------*/
Minotaur.prototype.send = function(sid, message) {
    var session = this._manager.getSession(sid);
    
    if(session) {
        session.queueMessage(message);
    }
};

/*------------------------------------------------------------------------------
  (private) _tickInterval
  
  + none
  - void
  
  Periodically loops through all active sessions and its clients, send queued 
  messages and increments each client.
------------------------------------------------------------------------------*/
Minotaur.prototype._tickInterval = function() {
	var self = this;

	setTimeout(function () {
		// loop through sessions
		self._manager.forEachSession(function(session) {
			// loop through session clients
			session.forEachClient(function(client) {
				// client connection have to be ready to send messages
				if(client.isPollReady) {
					if(client.messageBuffer.length > 0) {
						// send messages from buffer and clear it
						if(client.response) {
							client.isPollReady = false;
							self._sendResponse(
								client.response, 
								client.messageBuffer
							);
							client.messageBuffer = [];
						}
					} else {
						// send response for next poll when client "ticked" 
						// certain number of times (4 ticks should equal to ~1 
						// second)
						if(client.response && 
						   (client.ticks > self._POLL_TIMEOUT_IN_TICKS)) {
							client.isPollReady = false;
							self._sendResponse(
								client.response, 
								[{cmd: "poll"}]
							);
						}
					}
				}
				
				client.ticks += 1;
			});
		});

		self._tickInterval();
	}, self._TICK_TIMEOUT);
};

/*------------------------------------------------------------------------------
  (private) _expirationInterval
  
  + none
  - void
  
  Loops through active sessions and searches for timedout client connections. 
  If all clients of particular session are disconnected and detached then 
  session itself is also detached.
------------------------------------------------------------------------------*/
Minotaur.prototype._expirationInterval = function() {
    var self = this,
		expiration = new Date().getTime() - this._DISCONNECT_TIMEOUT;

	setTimeout(function () {
		// loop through sessions and detach timeod out clients
		self._manager.forEachSession(function(session) {
			session.forEachClient(function(client) {
				if(client.timestamp < expiration) {
					session.detachClient(client.id);
				}
			});
			
			if(session.clientsCount === 0) {
				session.disconnect();
				self._manager.detachSession(session.sid);
			}
		});

		self._expirationInterval();
	}, self._DISCONNECT_TIMEOUT);
};

/*------------------------------------------------------------------------------
  (private) _connect
  
  + request - incoming http request
  + response - outgoing http respone
  - void
  
  Processes incoming connection from client.
------------------------------------------------------------------------------*/
Minotaur.prototype._connect = function(request, response) {	
	var self = this,
		manager = self._manager,
		cookies = new Cookies(request, response, Keygrip),
		sessionID = self._getCookieSessionID(request, response),
		/*domain = request.headers.host.substring(
			request.headers.host.indexOf(".")
		),*/
		host = request.headers.host,
		domain = host.substring(host.indexOf(".")),
		session;
	
	if(sessionID) { // session ID (from cookie) exist
		session = manager.getSession(sessionID);
	
		if(session) { // session exist
			session.attachClient(
				response, 
				manager.assignPollDomain(sessionID, host)
			);
		} else { // session doesn't exist
			session = manager.attachSession(response, host);
			this.emit("connect", session);
		}
		
	} else { // session ID (from cookie) doesn't exist
		session = manager.attachSession(response, host);
		this.emit("connect", session);
	}
	
	if(session && session.sid) { // session with ID is assigned
		// set signed secure cookie within domain
		cookies.set(
			self._SESSION_COOKIE_NAME, 
			session.sid, 
			{ 
				signed: true, 
				domain: domain.substring(1, domain.indexOf(":"))
			}
		);
		// send client a message with assigned client ID and (sub)domain which
		// he can use for (long) polling communication
		self._sendResponse(
			response, 
			[{
				cmd: "client_begin",
				clientID: session.lastAssignedClientID,
				pollDomain: session.lastAssignedPollDomain
			}]
		);
	} else {
		self._sendResponse(response, [{cmd: "conn_err"}]);
	}
};

/*------------------------------------------------------------------------------
  (private) _poll
  
  + request - incoming http request
  + response - outgoing http respone
  + queryString - JSON representation of query string
  - void
  
  Processes client (long) polling.
------------------------------------------------------------------------------*/
Minotaur.prototype._poll = function(request, response, queryString) {	
	var self = this,
		sessionID = self._getCookieSessionID(request, response),
		session,
		client;

	if(sessionID && queryString && queryString.clientID) {
		session = self._manager.getSession(sessionID);

		if(session) {
			client = session.getClient(queryString.clientID);
			
			if(client) {
				client.response = response;
				client.timestamp = new Date().getTime();
				client.isPollReady = true;
				client.ticks = 0;
			} else {
				self._sendResponse(response, [{cmd: "poll_cli_inv"}]);
			}
		} else {
			self._sendResponse(response, [{cmd: "poll_ses_inv"}]);
		}
	} else {
		self._sendResponse(response, [{cmd: "poll_err"}]);
	}
};

/*------------------------------------------------------------------------------
  (private) _disconnect
  
  + request - incoming http request
  + response - outgoing http respone
  + queryString - JSON representation of query string
  - void
  
  Processes client disconnection.
------------------------------------------------------------------------------*/
Minotaur.prototype._disconnect = function(request, response, queryString) {	
	var self = this,
		sessionID = self._getCookieSessionID(request, response),
		session,
		client;
		
	if(sessionID && queryString && queryString.clientID) {
		session = self._manager.getSession(sessionID);

		if(session) {
			session.detachClient(queryString.clientID);
			
			if(session.clientsCount === 0) {
				session.disconnect();
				self._manager.detachSession(session.sid);
			}
			
			self._sendResponse(response, [{cmd: "disc_ok"}], "_jsnpsnd");
		} else {
			self._sendResponse(response, [{cmd: "disc_ses_inv"}], "_jsnpsnd");
		}
	} else {
		self._sendResponse(response, [{cmd: "disc_err"}], "_jsnpsnd");
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
	var self = this,
        sessionID = self._getCookieSessionID(request, response),
		session,
		message,
		field;

    if(sessionID && queryString) {
        session = self._manager.getSession(sessionID);
        
        if(session) {
            message = {};
            
    	    for(field in queryString) {
				if(queryString.hasOwnProperty(field)) {
					message[field] = self._sanitize(queryString[field]);
				}
            }
            
            session.receiveMessage(message);
        }
        
		self._sendResponse(response, [{cmd: "mess_ok"}], "_jsnpsnd");
    } else {
		self._sendResponse(response, [{cmd: "mess_err"}], "_jsnpsnd");
    }
};

/*------------------------------------------------------------------------------
  (private) _getCookieSessionID
  
  + request - incoming http request
  + response - outgoing http respone
  - sessionID - session identificator found in secure cookie
  
  Parse session ID from secured cookie.
------------------------------------------------------------------------------*/
Minotaur.prototype._getCookieSessionID = function(request, response) {
	var cookies = new Cookies(request, response, Keygrip);
	
	return cookies.get(this._SESSION_COOKIE_NAME, { signed: true });
};

/*------------------------------------------------------------------------------
  (private) _sanitize
  
  + message - string to be sanitized
  - string - sanitized string
  
  Replace characters ('&', '<', '>', '"', ''', '/') to prevent XSS.
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