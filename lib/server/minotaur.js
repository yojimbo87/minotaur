var util = require("util"), 
	http = require("http"),
	 url = require("url"),
	  qs = require("querystring"),
    Uuid = require("./node-uuid/uuid.js"),
 Keygrip = require("./keygrip/keygrip.js")(["wege4t4", "32r324f", "43f3frgr"]),
 Cookies = require("./cookies/cookies.js"),
 Manager = require("./manager");

var manager = new Manager();

/*------------------------------------------------------------------------------
  (public) Minotaur
  
  + httpServer - http server
  - void
  
  Set up minotaur server.
------------------------------------------------------------------------------*/
var Minotaur = module.exports = function Minotaur(httpServer) {	
	// http server
	this._httpServer = httpServer;
	// long poll timeout
	this._POLL_TIMEOUT = 1000 * 5;
	// client side cookie name where will be stored session ID
	this._SESSION_COOKIE_NAME = "__mssc";
};

Minotaur.prototype = new process.EventEmitter();

/*------------------------------------------------------------------------------
  (public) init
  
  + none
  - void
  
  Initialize minotaur server.
------------------------------------------------------------------------------*/
Minotaur.prototype.init = function() {
	var self = this, 
		path;

	this._httpServer.addListener("request", function(request, response) {
		path = url.parse(request.url).pathname;
		
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
			case "/msg":
				//self._message(request, response, url.parse(request.url, true).query);
				break;
			default:
				break;
		}
    });
	
	/*setTimeout(function() {
		manager.forEachSession(function(session) {
			if(session.messageBuffer.length > 0) {
				var buffer = session.messageBuffer;
				session.messageBuffer = [];
				
				session.forEachClient(function(client) {
					if(client.response) {
						manager.sendResponse(client.response, {messages: buffer});
					}
				});
			}
		});
	}, 250);*/
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
		cookies = new Cookies(request, response, Keygrip),
		sessionID = self._getCookieSessionID(request, response),
		session;
	
	if(sessionID) { // session ID (from cookie) exist
		session = manager.getSession(sessionID);
	
		if(session) { // session exist
			session.attachClient(response, manager.assignPollDomain(sessionID));
			
			//util.log("y " + session.sid);
		} else { // session doesn't exist
			session = manager.attachSession(response);
			this.emit("connect", session);
			
			//util.log("y new " + session.sid);
		}
		
	} else { // session ID (from cookie) doesn't exist
		session = manager.attachSession(response);
		this.emit("connect", session);
		
		//util.log("n " + session.sid);
	}
	
	if(session && session.sid) { // session with ID is assigned
		cookies.set(
			self._SESSION_COOKIE_NAME, 
			session.sid, 
			{ 
				signed: true, 
				domain: "developmententity.sk"
			}
		);
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
		session = manager.getSession(sessionID);

		if(session) {
			client = session.getClient(queryString.clientID);
			
			if(client) {
				client.response = response;
				client.timestamp = new Date().getTime();
				client.heartbeat = setTimeout(function() {
					self._sendResponse(response, [{cmd: "poll"}]);
				}, self._POLL_TIMEOUT);
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
  (private) _getCookieSessionID
  
  + request - incoming http request
  + response - outgoing http respone
  - sessionID
  
  Parse session ID from secured cookie.
------------------------------------------------------------------------------*/
Minotaur.prototype._getCookieSessionID = function(request, response) {
	var cookies = new Cookies(request, response, Keygrip);
	
	return cookies.get(this._SESSION_COOKIE_NAME, { signed: true });
};

/*------------------------------------------------------------------------------
  (private) _sendResponse
  
  + request - incoming http request
  + content - array of messages which will be sent in response
  
  Send response to client with array of messages in JSONP format.
------------------------------------------------------------------------------*/
Minotaur.prototype._sendResponse = function(response, content) {
	response.writeHead(200, {"Content-Type": "text/javascript"});
	response.write(
		"_jc(" + JSON.stringify({messages: content}) + ")", 
		"utf8"
	);
	response.end();
};