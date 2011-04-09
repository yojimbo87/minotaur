var util = require("util"), 
	http = require("http"),
	 url = require("url"),
	  qs = require("querystring"),
    Uuid = require("./node-uuid/uuid.js"),
 Keygrip = require("./keygrip/keygrip.js")(["wege4t4", "32r324f", "43f3frgr"]),
 Cookies = require("./cookies/cookies.js"),
 Manager = require("./manager");

 /*------------------------------------------------------------------------------
  Module constructor
------------------------------------------------------------------------------*/

var manager = new Manager();

var Minotaur = module.exports = function Minotaur(httpServer) {	
	// http server
	this._httpServer = httpServer;
	// long poll timeout
	this._POLL_TIMEOUT = 1000 * 15;
	// client side cookie name where will be stored session ID
	this._SESSION_COOKIE_NAME = "__mssc";
	// pool for assignement of unique subdomain to each polling client
	this._SUBDOMAIN_POOL = [
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

Minotaur.prototype = new process.EventEmitter();

/*------------------------------------------------------------------------------
  Public methods
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
				/*self._processHttpPost(request, function(data) {
					var obj = qs.parse(data);
					util.log("poll " + obj.foo);
					
					var cookie = cookies.get(self._SESSION_COOKIE_NAME, { signed: true });
					util.log("cook " + cookie);
					
					self._sendResponse(response, {foo: "poll"});
				});*/
				break;
			case "/msg":
				//self._message(request, response, url.parse(request.url, true).query);
				break;
			default:
				break;
		}
    });
};

/*------------------------------------------------------------------------------
  Private methods
------------------------------------------------------------------------------*/

Minotaur.prototype._connect = function(request, response) {	
	var self = this,
		cookies = new Cookies(request, response, Keygrip),
		sessionID = self._getCookieSessionID(request, response),
		session;
	
	if(sessionID) { // session ID (from cookie) exist
		session = manager.getSession(sessionID);
	
		if(session) { // session exist
			session.attachClient(response);
			
			util.log("y " + session.sid);
		} else { // session doesn't exist
			session = manager.attachSession(response);
			this.emit("connect", session);
			
			util.log("y new " + session.sid);
		}
		
	} else { // session ID (from cookie) doesn't exist
		session = manager.attachSession(response);
		this.emit("connect", session);
		
		util.log("n " + session.sid);
	}
	
	if(session && session.sid) { // session with ID is assigned
		cookies.set(self._SESSION_COOKIE_NAME, session.sid, { signed: true });
		self._sendResponse(
			response, 
			{ 
				clientID: session.lastAssignedClientID,
				pollDomain: self._assignPollDomain(session.sid)
			});
	} else {
		self._sendResponse(response, {clientID: 0});
	}
};

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
					self._sendResponse(response, {cmd: "poll"});
				}, self._POLL_TIMEOUT);
			}
		}
	} else {
		self._sendResponse(response, {cmd: "poll_err"});
	}
};

Minotaur.prototype._getCookieSessionID = function(request, response) {
	var cookies = new Cookies(request, response, Keygrip);
	
	return cookies.get(this._SESSION_COOKIE_NAME, { signed: true });
};

Minotaur.prototype._assignPollDomain = function(sessionID) {
	var clients = manager.getSession(sessionID).clients,
		itemClient,
		itemPollDomain,
		pollDomain;
	
	if(clients) {
		for(itemPollDomain in this._SUBDOMAIN_POOL) {
			for(itemClient in clients) {
				if(clients[item].pollDomain === 
					this._SUBDOMAIN_POOL[itemPollDomain]) {
					pollDomain = this._SUBDOMAIN_POOL[itemPollDomain];
					break;
				}
			}
			
			if(pollDomain) {
				break;
			}
		}
	}
	util.log(pollDomain);
	return pollDomain;
};

Minotaur.prototype._sendResponse = function(response, content) {
	response.writeHead(200, {"Content-Type": "text/javascript"});
	response.write("_jc(" + JSON.stringify(content) + ")", "utf8");
	response.end();
};