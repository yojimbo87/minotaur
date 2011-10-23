var http = require("http");
    util = require("util"),
    fs = require("fs"),
    Minotaur = require("../../lib/server/Minotaur");

var httpServer = http.createServer(function(req, res) {
    switch(req.url) {
        case "/":
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(fs.readFileSync(__dirname + '/index.html'));
            res.end();
            break;
        case "/favicon.ico":
            res.writeHead(200, {'Content-Type': 'image/x-icon'} )
            res.end();
            break;
        case "/minitaur.js":
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(fs.readFileSync('../../lib/client/minitaur.js'));
            res.end();
            break;
        case "/client.js":
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(fs.readFileSync(__dirname + '/client.js'));
            res.end();
            break;
        default:
            break;
    }
});
httpServer.listen(8080);
util.log("Running on 8080");

// set up minotaur with settings
var minotaur = new Minotaur({
	server: httpServer,
    subdomainPool: ["www1", "www2"]
});

// client connects to server  
minotaur.on("connect", function(client) {
    util.log("+C " + client.id + " [" + minotaur.clientsCount + ", " + minotaur.sessionsCount + "]");
    minotaur.broadcast({cmd: "in", cid: client.id}, client.id);
    
    client.on("message", function(data) {
        util.log("msg " + client.id);
        
        minotaur.broadcast({
            cmd: data.cmd,
            cid: client.id,
            content: data.content
        });
    });
    
    client.on("disconnect", function(reason) {
        util.log("-C " + client.id + " [" + minotaur.clientsCount + ", " + minotaur.sessionsCount + "] reason: " + reason);
        minotaur.broadcast({cmd: "out", cid: client.id});
    });
});

// initialize minotaur server
minotaur.init();