function Minitaur() {
    var currentToken = 0;
    
    var connect = function() {
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
                        $(document).trigger("message", value);
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
    
    var send = function(data) {
        if(data != "") {
            $.jsonp({
                url: "/msg",
                data: {"cmd": "msg", "content": data.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
            });
        }
    };
    
    var on = function(eventName, callback) {
        switch(eventName) {
            case "message":
                $(document).bind("message", function(event, data) {
                    callback(data);
                });
                break;
            default:
                break;
        }
    };
    
    this.connect = connect;
    this.on = on;
    this.send = send;
}
