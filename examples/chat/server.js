var util = require("util"), 
	http = require("http"),
	 url = require("url"),
	  qs = require("querystring"),
	  fs = require("fs"),
Minotaur = require("../../lib/server/minotaur"),
    PORT = 8080;

// http server for serving static files
var httpServer = http.createServer(function(req, res) {  
    var path = url.parse(req.url).pathname;
    switch(path) {
        case "/":
            fs.readFile("./index.html", function (err, data) {
                res.writeHead(200, {"Content-Type": "text/html"});
                res.write(data, "utf8");
	            res.end();
            });
            break;
		case "/client.js":
            fs.readFile("./" + path, function(err, data){
                res.writeHead(200, {"Content-Type": "text/javascript"});
            	res.write(data, "utf8");
            	res.end();
            });
            break;
		case "/minitaur.js":
			fs.readFile("../../lib/client/" + path, function(err, data){
                res.writeHead(200, {"Content-Type": "text/javascript"});
            	res.write(data, "utf8");
            	res.end();
            });
			break;
        default:
            break;
    }
});
httpServer.listen(PORT);
util.log("Listening on port " + PORT);

// set up minotaur with settings
var minotaur = new Minotaur({
	server: httpServer,
	pollTimeout: 15000,
	disconnectTimeout: 20000
});

// client connects to server
minotaur.on("connect", function(session) {
	// console message about new session connection
	util.log("+S " + session.sid + " [" + minotaur.sessionsCount + "]");
	
	// broadcast message to everyone (except this client connection) that this
	// client has connected
    minotaur.broadcast({cmd: "in", sid: session.sid}, session.sid);
	
	// new session client has connected
	session.on("clientConnect", function(clientID) {
		// console message about new session client connection
		util.log("  +C " + clientID + " [" + session.clientsCount + "]");
	});
	
	// session client has disconnected
	session.on("clientDisconnect", function(clientID) {
		// console message about session client disconnection
		util.log("  -C " + clientID + " [" + session.clientsCount + "]");
	});
	
	// client receives message
    session.on("message", function(message) {
        if(message && message.cmd && message.content) {
			// broadcast message to everyone
            minotaur.broadcast({
				cmd: message.cmd, 
				sid: session.sid, 
				content: message.content
			});
        }
    });
    
	// client disconnected from server
    session.on("disconnect", function() {
		// console message about session disconnection
		util.log("-S " + session.sid + " [" + minotaur.sessionsCount + "]");
		
		// broadcast to all connected sessions message about this session
		// disconnection
        minotaur.broadcast({cmd: "out", sid: session.sid});
    });
});

// initialize minotaur server
minotaur.init();