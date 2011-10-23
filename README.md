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

**Server side (node-uuid is included in minotaur source):**

 * [node.js](http://nodejs.org/)
 * [node-uuid](https://github.com/broofa/node-uuid) node.js module for generating unique session and client GUIDs

**Client side:**

 * [jQuery](http://jquery.com/) for AJAX stuff

 
Tested browsers
---------------

 * IE: 7+
 * FF: 3.6+
 * Chrome: 10+
 * Opera: 10+


Tested node.js versions
-----------------------
 
 * v0.4.x
 
 
Usage and examples
==================

Minotaur module consists of server and client side part. Server side manages communication with multiple clients in real-time using long polling technique. Usage principle is shown below.

Server side
-----------

	var util = require("util"),
		...
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

	// new client connects to the minotaur server
	minotaur.on("connect", function(client) {
		
		// client receives a message
		client.on("message", function(data) {
			...
		});

		// client is disconnected from the minotaur server
		client.on("disconnect", function(reason) {
			...
		});
	});

	// initialize minotaur server
	minotaur.init();


Client side (with minitaur.js)
------------------------------

Client which communicates with minotaur server is called minitaur.js and is located in **lib/client/minitaur.js**.

	// client connects to the server
	minitaur.on("connect", function() {
		...
	});

	// client receives a message
	minitaur.on("message", function(data) {
		...
	});

	// client disconnects from server
	minitaur.on("disconnect", function() {
		...
	});
    
    // client error handler
    minitaur.on("error", function(data) {
        ...
    });

	// initiate client connection with server
	minitaur.connect({
		host: "my.domain.xyz:port"
	});

Simple chat application which uses minotaur module is located in **examples/chat/** folder and it can be run with

    node server.js

command. Do not forget to set host option on the client side in order to initiate long polling correctly (for more information see Minotaur constructor).


API
===

Minotaur has two crucial components - server side node.js minotaur module and client side minitaur.


Minitaur (client side)
----------------------

**connect(options)**

(Method) Initiates connection with the server based on given options.

    var options = {
		// (required) host which minitaur connects to
        host: "my.domain.xyz:8080",
        // (optional) AJAX request timeout in miliseconds used during initial connection or sending data
        ajaxTimeout: 35000,
        // (optional) timeout in miliseconds during individual polling requests
        pollTimeout: 30000
        // (optional) used for sending credentials data when connecting to server
        credentials: ...
    };

**send(data)**

(Method) Send data object to server.

**on(eventName, callback)**

(Event) Emitted on connect, message, disconnect and error event.


Minotaur (server side)
----------------------

**Minotaur(options)**

(Constructor) Creates a new minotaur instance based on passed options object. Subdomain pool is used for assigning unique poll URLs for connected clients in order to overcome browser specific [parallel connection](http://www.stevesouders.com/blog/2008/03/20/roundup-on-parallel-connections/) limit when user have multiple tabs opened in one browser context.

    var options = {
		// (required) http server which will serve static files
		server: httpServer,
		// (optional) long polling timeout
		pollTimeout: 5000,
		// (optional) pool of subdomains which will be used for assigning unique poll URLs to overcome browser parallel connections limitation
		subdomainPool: [ "www1", "www2", "www3", ... ]
	};

**clientsCount** 

(Property) Total number of actively connected clients to minotaur server.	

**sessionsCount** 

(Property) Total number of actively connected browser sessions to minotaur server. For example one browser session can have multiple tabs, and thus clients, connected to minotaur server.

**init()** 

(Method) Initialize minotaur server and starts listening to incoming client connections.

**disconnect(clientID)** 

(Method) Disconnect specific client connection from minotaur server.

**broadcast(message, [exceptCID])** 

(Method) Broadcasts message to all connected clients. Optional 'exceptCID' parameter is for the case when specific client should be omitted from the broadcast.

**send(clientID, message)** 

(Method) Send message to specified client.

**on("connect", function(client) {})** 

(Event) Emitted when new client connection is initiated. Callback contains client object.

 
Client (server side)
---------------------

**id** 

(Property) Client identifier.

**sessionID** 

(Property) Session identifier to which this client belongs.

**subdomain** 

(Property) Subdomain name within which is this client polling.

**request** 

(Property) Node.js HTTP request object of this client.

**response** 

(Property) Node.js HTTP response object of this client.

**data** 

(Property) Variable for additional data for this client.

**on("message", function(message) {})** 

(Event) Emitted when new message is received. Callback contains message data.

**on("disconnect", function(reason) {})** 

(Event) Emitted when client is disconnected from the server. 


Contributors
============

 * Konstantin Starodubtsev