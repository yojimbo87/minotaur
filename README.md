Minotaur
========

Minotaur is a [long poll](http://en.wikipedia.org/wiki/Push_technology) server implemented 
in [node.js](http://nodejs.org/). Communication with clients is based on [JSONP](http://en.wikipedia.org/wiki/JSONP#JSONP) 
to overcome [same origin policy](http://en.wikipedia.org/wiki/Same_origin_policy) when serving 
web pages and real-time communication from different origins (host, protocol or port).


Compatibility
-------------

**Server side:**

 * tested with node.js v0.2.5, v0.2.6 and v0.3.0

**Client side (tested browsers):**

 * Internet Explorer 8
 * Firefox 3.6.12+
 * Chrome 8.0.552.210+
 * Opera 10.63+


Usage
-----

Usage examples are located in 'examples' folder:

 * 'multi-chat' broadcasts messages to every currently connected client
 * 'multi-chat-bot' is automated version of multi-chat example where client randomly generates message and broadcast it after some random timeout

**Server side:**

    var mino = require("/lib/minotaur/server");
    
    server = http.createServer(function(req, res) {
        // your http server code
        // don't forget jquery, jquery-jsonp and minitaur client (see examples)
    });
    server.listen(8080)
    
    // initialize minotaur with server and optional parameter for debugging output
    var minotaur = new mino(server, true);
    
    // handle events
    minotaur.on("connect", function(session) {
        // do something when new session is created
    
        session.on("message", function(message) {
            // do something when session receive a message
        });
        
        session.on("disconnect", function(message) {
            // do something when session is disconneting
        });
    });


**Client side:**

Client code file is located in *examples/common/* folder as *minitaur.js*.

    // initialize minitaur client
    var mini = new Minitaur();
    
    $(document).ready(function() {
        // connect to server
        mini.connect();
        
        mini.on("connect", function() {
            // do something when client is connected to server
        });
        
        // send message from client to server
        mini.send("hello");
        
        mini.on("message", function(data) {
            // do something when client receive a message
        });
        
        mini.on("disconnect", function(data) {
            // do something when client is disconnected from server
        });
    });


Dependencies
------------

**Server side:**

 * [node.js](http://nodejs.org/)
 * [node-uuid](https://github.com/broofa/node-uuid) module for generating session IDs
 * [cookie-node](https://github.com/jed/cookie-node) module for signing cookies

**Client side:**

 * [jQuery](http://jquery.com/) for write less, do more
 * [jQuery-JSONP](http://code.google.com/p/jquery-jsonp/) plugin for simplified JSONP handling


Stability and performance
-------------------------

Successfuly tested with 50 simultaneously connected clients through various browsers using multi-chat-bot example.


Known limitations
-----------------

 * [Page loading behavior](http://code.google.com/p/jquery-jsonp/issues/detail?id=31) in Firefox 3.6.12+ and Opera 10.63+
 * [Multiple JSONP polling requests](http://code.google.com/p/jquery-jsonp/issues/detail?id=34) - browser specific limitation occuring when certain number of (long polling) tabs within browser context is opened


Architecture
------------

[Tales of the minotaur or long polling with node.js](http://tomi.developmententity.sk/Blog/Post/7) - blog post about certain parts of long poll server architecture.


TODO
----

 * API documentation
 * Message sanitation 