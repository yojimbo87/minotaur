Minotaur (devel version)
========================

Minotaur is a [long poll](http://en.wikipedia.org/wiki/Push_technology) server implemented 
in [node.js](http://nodejs.org/). Communication with clients is based on [JSONP](http://en.wikipedia.org/wiki/JSONP#JSONP) 
to overcome [same origin policy](http://en.wikipedia.org/wiki/Same_origin_policy) when serving 
web pages and real-time communication from different origins (host, protocol or port).

Dependencies
------------

**Server side (all node.js modules are included):**

 * [node.js](http://nodejs.org/)
 * [node-uuid](https://github.com/broofa/node-uuid) node.js module for generating unique session and client IDs
 * [cookies](https://github.com/jed/cookies) node.js module for cookies manipulation
 * [keygrip](https://github.com/jed/keygrip) node.js module for signing cookies

**Client side:**

 * [jQuery](http://jquery.com/) for writing less and doing more
 * [jquery-tmpl](https://github.com/jquery/jquery-tmpl) in one-to-one example
 * [jGrowl](http://stanlemon.net/projects/jgrowl.html) in one-to-one example

API (minotaur server)
=====================

Minotaur
--------

**Minotaur(options)** creates a new minotaur instance.

 * options - includes various settings for server
 
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
	
**init()** initialize minotaur server and starts listening to incoming connections.

**broadcast(message, [exceptSID])** broadcasts message to all connected session clients.

 * message
 * exceptSID (optional) - session ID which will be omitted during broadcast
 
**send(sid, message)** send message to specified session based on his session ID.

 * sid - session ID
 * message

**event: connect(session)** emitted when new session is initiated.

 * session

Session
-------
 
**property: sid** session ID

**property: clients** object containing clients bound to session

**property: clientsCount** number of client bound to session
 
**property: data** variable for additional data

**property: lastAssignedClientID** client ID which was last assigned

**property: lastAssignedPollDomain** poll domain which was last assigned

**event: message(message)** emitted when new message is received

 * message
 
**event: disconnect** emitted when session is disconnected from server
 
**event: client()** emitted when new client connection (for example new tab) is initiated within existing session.
