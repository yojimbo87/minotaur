Minotaur (devel version)
========================

Minotaur is a [long poll](http://en.wikipedia.org/wiki/Push_technology) server implemented 
in [node.js](http://nodejs.org/). Communication with clients is based on [JSONP](http://en.wikipedia.org/wiki/JSONP#JSONP) 
to overcome [same origin policy](http://en.wikipedia.org/wiki/Same_origin_policy) when serving 
web pages and real-time communication from different origins (host, protocol or port).

Dependencies
------------

**Server side (all node.js modules are natively included which means they are not installed as dependencies through npm):**

 * [node.js](http://nodejs.org/)
 * [node-uuid](https://github.com/broofa/node-uuid) node.js module for generating unique session and client IDs
 * [cookies](https://github.com/jed/cookies) node.js module for cookies manipulation
 * [keygrip](https://github.com/jed/keygrip) node.js module for signing cookies

**Client side:**

 * [jQuery](http://jquery.com/) for AJAX stuff

 
API (minotaur server)
=====================


Minotaur
--------

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

 
Session
-------

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

**disconnect** 

(Event) Emitted when session is disconnected from the server.
 
**client()** 

(Event) Emitted when new client connection (for example new tab) is initiated within existing session.


TODO
====

 * Minotaur property for total number of connected sessions.