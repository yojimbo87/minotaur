Minotaur
========

Minotaur is a [long poll](http://en.wikipedia.org/wiki/Push_technology) server implemented 
in [node.js](http://nodejs.org/). Communication with clients is based on [JSONP](http://en.wikipedia.org/wiki/JSONP#JSONP) 
to overcome [same origin policy](http://en.wikipedia.org/wiki/Same_origin_policy) when serving 
web pages and real-time communication from different origins (host, protocol or port).


Compatibility
-------------

**Server side:**
 * node.js v0.2.5 and v0.3.0

**Client side (tested browsers):**
 * Internet Explorer 8
 * Firefox 3.6.12+
 * Chrome 8.0.552.210
 * Opera 10.63+


Usage
-----

Usage examples are located in 'examples' folder:
 * 'multi-chat' broadcasts messages to every currently connected client
 * 'multi-chat-bot' is automated version of multi-chat example where client randomly generates message and broadcast it after some random timeout


Dependencies
------------

**Server side:**
 * [node.js](http://nodejs.org/)
 * [cookie-node](https://github.com/jed/cookie-node) module for signing cookies

**Client side:**
 * [jQuery](http://jquery.com/) for write less, do more
 * [jQuery-JSONP](http://code.google.com/p/jquery-jsonp/) plugin for simplified JSONP handling


Stability and performance
-------------------------

Successfuly tested with 50 simultaneously connected clients through various browsers using multi-chat-bot example.


Known issues
------------

 * [Page loading behavior](http://code.google.com/p/jquery-jsonp/issues/detail?id=31) in Firefox 3.6.12 and Opera 10.63+


TODO
----

 * Client reconnection
 * Client/server side error handling
 * Documentation about architecture