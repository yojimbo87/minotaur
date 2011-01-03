var mini = new Minitaur();

$(document).ready(function() {
    mini.connect();
    
    mini.on("connect", function() {
        $("#area-chat").prepend("<div class=\"msg\">Connected ...</div>");
    });
    
    mini.on("message", function(data) {
        switch(data.cmd) {
            case "in":
                $("#area-chat").prepend("<div class=\"msg\">" + data.id + " connected!</div>");
                break;
            case "out":
                $("#area-chat").prepend("<div class=\"msg\">" + data.id + " disconnected!</div>");
                break;
            case "msg":
                $("#area-chat").prepend("<div class=\"msg\"><b>" + data.id + "</b>: " + data.content + "</div>");
                break;
            default:
                break;
        }
    });
    mini.on("disconnect", function() {
        $("#area-chat").prepend("<div class=\"msg\">Disconnected, reconnecting ...</div>");
        setTimeout("mini.connect()", 10000);
    });
    // initialize periodical sending of random messages
    sendRandomMessage();
    
    // clear chat area after 60 seconds to prevent large chat history
    setInterval(function() {        
        $("#area-chat").text("");
    }, 1000 * 60);
});

var randomTimeout = Math.floor(Math.random()*11) * 1000 + 1000;;
var randomStringLength = Math.floor(Math.random()*8) + 3;

function sendRandomMessage() {
    setTimeout(function() {
        randomNumber = Math.floor(Math.random()*11) * 1000 + 1000;
        randomStringLength = Math.floor(Math.random()*23) + 3;
        
        mini.send(generateString(randomStringLength))
        
        sendRandomMessage();
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

function debug(msg) {
    $("#debug").append(msg + "<br />");
}