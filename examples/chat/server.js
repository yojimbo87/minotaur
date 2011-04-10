var util = require("util"), 
	http = require("http"),
	 url = require("url"),
	  qs = require("querystring"),
	  fs = require("fs"),
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
        case "/jquery-1.5.2.min.js":
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

var minotaur = new Minotaur(httpServer);

minotaur.on("connect", function(session) {
    //minotaur.broadcast({cmd: "in", id: session.sid}, session.sid);
	util.log("connected in " + session.sid);
    
    session.on("message", function(message) {
        /*if(message && message.cmd && message.content) {
            minotaur.broadcast({cmd: message.cmd, id: session.sid, content: message.content});
        }*/
		util.log("got msg " + session.sid + ": " + message);
    });
    
    session.on("disconnect", function(message) {
        //minotaur.broadcast({cmd: "out", id: session.sid});
		util.log("disconnected " + session.sid);
    });
});

minotaur.init();