Minotaur
========

Minotaur is a cross browser, [long poll](http://en.wikipedia.org/wiki/Push_technology) server implemented in [node.js](http://nodejs.org/). Communication with clients is based on [JSONP](http://en.wikipedia.org/wiki/JSONP#JSONP) transport to overcome [same origin policy](http://en.wikipedia.org/wiki/Same_origin_policy) from different origins (host, protocol or port) during real-time communication.

Installation
------------

Minotaur module can be installed either through npm

    npm install minotaur
	
or cloned from a github respository

    git clone git://github.com/yojimbo87/minotaur.git


Dependencies
------------

**Server side (all node.js modules are natively included which means they do not need to be installed as dependencies through npm for example):**

 * [node.js](http://nodejs.org/)
 * [node-uuid](https://github.com/broofa/node-uuid) node.js module for generating unique session and client IDs
 * [cookies](https://github.com/jed/cookies) node.js module for cookies manipulation
 * [keygrip](https://github.com/jed/keygrip) node.js module for signing cookies

**Client side (node-uuid is included in minitaur.js client):**

 * [jQuery](http://jquery.com/) for AJAX stuff
 * [node-uuid](https://github.com/broofa/node-uuid) natively included in minitaur client


Usage
=====

Minotaur module consists of server and client side part. Server side manages communication with multiple clients in real-time long polling technique. Usage principle is shown below.

Server side
-----------

	var util = require("util"),
		Minotaur = require("minotaur");
	...

	var httpServer = http.createServer(function(req, res) {
	...
	});
	httpServer.listen(8080);

	// set up minotaur with settings
	var minotaur = new Minotaur({
		server: httpServer
	});

	minotaur.on("connect", function(session) {
		// client connects to server
			
		session.on("message", function(message) {
			// server receives a message from client
		});
		

		session.on("disconnect", function(message) {
			// client is disconnected from server
		});
	});

	// initialize minotaur server
	minotaur.init();


Client side (with minitaur.js)
------------------------------

Client which communicates with minotaur server is called minitaur.js and is located in **lib/client/minitaur.js**.

	minitaur.on("connect", function() {
		// client connects to server
	});

	// client receives a message
	minitaur.on("message", function(data) {
		// client receives a message from server
	});

	// client disconnects from server
	minitaur.on("disconnect", function() {
		// client is disconnected from server
	});

	// initiate client connection with server
	minitaur.connect({
		host: "my.domain.xyz:8080"
	});

 
API
===

Minitaur (client side)
----------------------

**status**

(Property) Indicates current status of connection with the server.

**connect(options)**

(Method) Initiates connection with the server based on given options.

    var options = {
		// (required) host which minitaur connects to
        host: "my.domain.xyz:8080"
    };

**disconnect()**

(Method) Disconnects from the server.

**send(data)**

(Method) Send data object to server.

**on(eventName, callback)**

(Event) Emitted on connect, message and disconnect event.


Minotaur (server side)
----------------------

**Minotaur(options)**

(Constructor) Creates a new minotaur instance based on passed options object.

    var options = {
		// (required) http server which will serve static files
		server: httpServer,
		// (optional) name of the cookie which will be used to store secured session ID on the client side
		sessionCookieName: "__mssc",
		// (optional) long polling timeout
		pollTimeout: 5000
		// (optinal) timeout for client disconnection
		disconnectTimeout: 15000
		// (optional) pool of subdomains which will be used for assigning unique poll URLs
		subdomainPool: [ "www1", "www2", "www3" ]
	};
	
**init()** 

(Method) Initialize minotaur server and starts listening to incoming connections.

**broadcast(message, [exceptSID])** 

(Method) Broadcasts message to all connected session clients. Optional 'exceptSID' parameter is for case when specific session should be omitted from the broadcast.

**send(sid, message)** 

(Method) Send message to specified session based on session ID.

**connect(session)** 

(Event) Emitted when new session connection is initiated.

 
Session (server side)
---------------------

**sid** 

(Property) Session identificator.

**clients** 

(Property) Object containing clients stored in hash structure. Field name represents client ID and its value contains client object.

**clientsCount** 

(Property) Total number of clients bound to session.
 
**data** 

(Property) Variable for additional data for session.

**lastAssignedClientID**

(Property) Client ID which was last assigned.

**lastAssignedPollDomain** 

(Property) Poll domain which was last assigned.

**message(message)** 

(Event) Emitted when new message is received.

**disconnect()** 

(Event) Emitted when session is disconnected from the server.
 
**client()** 

(Event) Emitted when new client connection (for example new tab) is initiated within existing session.


TODO
====

 * Minotaur property for total number of connected sessions.