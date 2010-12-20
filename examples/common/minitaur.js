function Minitaur() {
    var currentToken = 0;
    var status = "";
    
    var connect = function() {
        $.jsonp({
            url: "/connect",
            success: function(data) {
                currentToken = data.token;
                status = "connected";
                poll();
            },
            error: function(xOptions, textStatus) {
                status = "disconnected";
                $(document).trigger("minitaur_disconnect");
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
                        $(document).trigger("minitaur_message", value);
                    });
                }
                poll();
            },
            error: function(xOptions, textStatus) {
                status = "disconnected";
                $(document).trigger("minitaur_disconnect");
            },
            timeout: 20000
        });
    };
    
    var send = function(data) {
        if((status == "connected") && (data != "")) {
            $.jsonp({
                url: "/msg",
                data: {"cmd": "msg", "content": data.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
            });
        }
    };
    
    var on = function(eventName, callback) {
        switch(eventName) {
            case "message":
                $(document).bind("minitaur_message", function(event, data) {
                    callback(data);
                });
                break;
            case "disconnect":
                $(document).bind("minitaur_disconnect", function(event) {
                    callback();
                });
                break;
            default:
                break;
        }
    };
    
    this.status = status;
    this.connect = connect;
    this.on = on;
    this.send = send;
}
