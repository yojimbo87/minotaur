var util = require("util"), 
	http = require("http"),
	 url = require("url"),
	  qs = require("querystring"),
	  fs = require("fs"),
Supervisor = require("./supervisor"),
Minotaur = require("../../lib/server/minotaur"),
    PORT = 8080;

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
		case "/styles.css":
			fs.readFile("./styles.css", function(err, data){
                res.writeHead(200, {"Content-Type": "text/css"});
            	res.write(data, "utf8");
            	res.end();
            });
			break;
        case "/jquery-1.5.2.min.js":
		case "/cint.js":
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

var supervisor = new Supervisor();
var minotaur = new Minotaur(httpServer);

minotaur.on("connect", function(session) {
	supervisor.attachUser(session.sid, session.sid);
	// get me the list of online users
	supervisor.forEachUser(function(user) {
		if(user.hash !== session.sid) {
			minotaur.send(
				session.sid, 
				{cmd: "in", id: user.hash, name: user.name}
			);
		}
	});
	// tell everyone that I'm online
    minotaur.broadcast(
		{cmd: "in", id: session.sid, name: session.sid}, 
		session.sid
	);
	
	session.on("client", function() {
		// get me the list of online users
		supervisor.forEachUser(function(user) {
			if(user.hash !== session.sid) {
				minotaur.send(
					session.sid, 
					{cmd: "in", id: user.hash, name: user.name}
				);
			}
		});
	});
	
    session.on("message", function(message) {
        if(message && message.cmd) {
			switch(message.cmd) {
				case "msg":
					if(message.dest && message.content) {
						// send message to receiver
						minotaur.send(
							message.dest,
							{cmd: "msg", source: session.sid, content: message.content}
						);
						// send message to sender
						minotaur.send(
							session.sid,
							{cmd: "msg", source: "me", content: message.content}
						);
					}
					break;
				case "getName":
					minotaur.send(
						session.sid, 
						{
							cmd: "getName", 
							name: supervisor.getUser(session.sid).name
						}
					);
					break;
				case "setName":
					supervisor.getUser(session.sid).name = message.name;
					supervisor.forEachUser(function(user) {
						minotaur.broadcast(
							{
								cmd: "nameChange", 
								id: session.sid,
								name: message.name
							}, 
							session.sid
						);
					});
					break;
				default:
					break;
			}
        }
    });
    
    session.on("disconnect", function(message) {
		supervisor.detachUser(session.sid);
		// tell everyone that I'm offline
        minotaur.broadcast({cmd: "out", sid: session.sid});
    });
});

minotaur.init();