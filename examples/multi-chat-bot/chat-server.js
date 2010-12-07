var sys = require("sys"),
   http = require("http"),
    url = require("url"),
     fs = require("fs"),
   mino = require("../../lib/minotaur/server");
 
var minotaur = new mino(true);

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
            fs.readFile("../common" + path, function(err, data){
                res.writeHead(200, {"Content-Type": "text/javascript"});
            	res.write(data, "utf8");
            	res.end();
            });
            break;
        case "/chat-client.js":
            fs.readFile("./" + path, function(err, data){
            	res.writeHead(200, {"Content-Type": "text/javascript"});
            	res.write(data, "utf8");
            	res.end();
            });
            break;
        case "/connect":
            var sid = minotaur.connect(req, res);
            minotaur.broadcast({cmd: "in", id: sid});
            break;
        case "/poll":
            minotaur.poll(req, res, url.parse(req.url, true).query);
            break;
        case "/msg":
            minotaur.message(req, res, url.parse(req.url, true).query, function(sid, content) {
                minotaur.broadcast({cmd: "msg", id: sid, content: content});
            });
            break;
        default:
            res.writeHead(404);
            res.write("404");
            res.end();
            break;
    }
});

server.listen(8080);

sys.log("Listening on 8080");
