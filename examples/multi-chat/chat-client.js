function Client() {
    var cookieName = "";
    
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
                cookieName = data.cookie;
                cname = data.cookie;
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
            $.jsonp({
                url: "/msg",
                data: {"cookie": cookieName, "cmd": "msg", "content": $("#text-send").val().replace(/</g, "&lt;").replace(/>/g, "&gt;")}
            });
            
            $("#text-send").val("");
    };
    
    this.connect = connect;
}

$(document).ready(function() {
    var client = new Client();
    client.connect();
});