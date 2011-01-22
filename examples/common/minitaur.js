function Minitaur() {
    var currentClientID = null;
    var status = "";
    
    var connect = function() {
        $.jsonp({
            url: "/connect",
            success: function(data) {
                currentClientID = data.client;
                status = "connected";
                $(document).trigger("minitaur_connect");
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
            timeout: 30000,
            data: {"client": currentClientID, "cmd": "poll"},
            success: function(data) {
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
            }
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
            case "connect":
	            $(document).bind("minitaur_connect", function(event) {
	                callback();
	            });
	            break;
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
