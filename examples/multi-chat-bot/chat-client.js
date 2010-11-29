function Client() {
    var cookieName = "";
    
    var connect = function() {    
        $.jsonp({
            url: "/connect",
            success: function(data) {
                cookieName = data.cookie;
                globalCookieName = data.cookie;
                poll();
            }
        });
    };
    
    var poll = function() {
        $.jsonp({
            url: "/poll",
            data: {"cookie": cookieName, "cmd": "poll"},
            success: function(data) {
                $.each(data, function (index, value) {
                    parseMessage(value);    
                });
                poll();
            },
            timeout: 20000
        });
    };
    
    var parseMessage = function(msg) {
        switch(msg.cmd) {
            case "in":
                $("#area-chat").prepend("<div class=\"msg\">" + msg.id + " connected!</div>");
                break;
            case "out":
                $("#area-chat").prepend("<div class=\"msg\">" + msg.id + " disconnected!</div>");
                break;
            case "msg":
                $("#area-chat").prepend("<div class=\"msg\"><b>" + msg.id + "</b>: " + msg.content + "</div>");
        	    break;
            default:
                break;
        }
    };
    
    this.connect = connect;
}

$(document).ready(function() {
    // initialize client
    var client = new Client();
    client.connect();

    // initialize periodical sending of random messages
    send();
    
    // clear chat area after 60 seconds
    setInterval(function() {        
        $("#area-chat").text("");
    }, 1000 * 60);
});

var randomTimeout = Math.floor(Math.random()*11) * 1000 + 1000;;
var randomStringLength = Math.floor(Math.random()*8) + 3;
// cookieName will be stored also here during initial client connection
var globalCookieName;

function send() {
    setTimeout(function() {
        randomNumber = Math.floor(Math.random()*11) * 1000 + 1000;
        randomStringLength = Math.floor(Math.random()*23) + 3;
        
        $.jsonp({
            url: "/msg",
            data: {"cookie": globalCookieName, "cmd": "msg", "content": generateString(randomStringLength)}
        });
        
        send();
    }, randomTimeout);
}

function generateString(sLength)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < sLength; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}