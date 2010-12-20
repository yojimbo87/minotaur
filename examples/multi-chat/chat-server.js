var sys = require("sys"),
   http = require("http"),
    url = require("url"),
     fs = require("fs"),
   mino = require("../../lib/minotaur/server"),
   server;

server = http.createServer(function(req, res) {
    var path = url.parse(req.url).pathname;
    switch(path) {
        case "/":
            fs.readFile("./index.html", function (err, data) {
                res.writeHead(200, {"Content-Type": "text/html"});
                res.write(data, "utf8");
	            res.end();
            });
            break;
        case "/jquery-1.4.4.min.js":
        case "/jquery.jsonp-2.1.4.min.js":
        case "/minitaur.js":
            fs.readFile("../common" + path, function(err, data){
                res.writeHead(200, {"Content-Type": "text/javascript"});
            	res.write(data, "utf8");
            	res.end();
            });
            break;
        case "/chat-client.js":
            fs.readFile("." + path, function(err, data){
            	res.writeHead(200, {"Content-Type": "text/javascript"});
            	res.write(data, "utf8");
            	res.end();
            });
            break;
        default:
            // 404
            break;
    }
});
server.listen(8080);
sys.log("Minotaur listening on port 8080");

var minotaur = new mino(server, true);

minotaur.on("connect", function(session) {
    minotaur.broadcast({cmd: "in", id: session.sid});
    
    session.on("message", function(message) {
        minotaur.broadcast({cmd: "msg", id: session.sid, content: message});
    });
    
    session.on("disconnect", function(message) {
        minotaur.broadcast({cmd: "out", id: session.sid});
    });
});