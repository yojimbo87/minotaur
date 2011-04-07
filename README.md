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
 * [node-uuid](https://github.com/broofa/node-uuid) node.js module for generating session IDs
 * [cookies](https://github.com/jed/cookies) node.js module for cookies manipulation
 * [keygrip](https://github.com/jed/keygrip) node.js module for signing cookies

**Client side:**

 * [jQuery](http://jquery.com/) for writing less and doing more

TODO
----

 * Rewrite old server side long poll architecture
 * Rewrite old client
 * Use jQuery native Ajax functions with JSONP transport
 * Overcome browser parallel connections limit with either unique poll domain or HTML5 storage