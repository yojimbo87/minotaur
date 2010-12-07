function Client() {
    var currentToken = 0;
    
    var connect = function() {    
        $("#button-send").click(function() {
            sendMessage();
        });
        
        $("#text-send").keyup(function(e) {
            if(e.keyCode == 13) {
                sendMessage();
            }
        });
        
        $.jsonp({
            url: "/connect",
            success: function(data) {
                currentToken = data.token;
                poll();
            }
        });
    };
    
    var poll = function() {
        $.jsonp({
            url: "/poll",
            data: {"token": currentToken, "cmd": "poll"},
            success: function(data) {
                currentToken = data.token;
                if(data.messages) {
	                $.each(data.messages, function (index, value) {
	                    parseMessage(value);    
	                });
                }
                poll();
            },
            error: function(xOptions, textStatus) {
                debug(xOptions.context + " : " + textStatus);
            },
            timeout: 20000
        });
    };
    
    var parseMessage = function(msg) {
        switch(msg.cmd) {
            case "in":
                $("#area-chat").append("<div class=\"msg\">" + msg.id + " connected!</div>");
                break;
            case "out":
                $("#area-chat").append("<div class=\"msg\">" + msg.id + " disconnected!</div>");
                break;
            case "msg":
                $("#area-chat").append("<div class=\"msg\"><b>" + msg.id + "</b>: " + msg.content + "</div>");
        	    break;
            default:
                break;
        }
        $("#area-chat").scrollTop($("#area-chat").height());
    };
    
    var sendMessage = function() {
        if($("#text-send").val() != "") {
            $.jsonp({
                url: "/msg",
                data: {"cmd": "msg", "content": $("#text-send").val().replace(/</g, "&lt;").replace(/>/g, "&gt;")}
            });
            
            $("#text-send").val("");
        }
    };
    
    this.connect = connect;
}

$(document).ready(function() {
    var client = new Client();
    client.connect();
});

function debug(msg) {
    $("#debug").append(msg + "<br />");
}