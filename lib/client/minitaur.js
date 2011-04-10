var minitaur = (function (undefined) {
	var AJAX_TIMEOUT = 1000 * 10,
		POLL_TIMEOUT = 1000 * 17,
		RECONNECT_TIMEOUT = 1000 * 15,
		status = "disconnected",
		clientID,
		pollDomain;

	function connect() {
		$.ajax({
			url: "http://master.developmententity.sk:8080/connect",
			dataType: 'jsonp',
			jsonpCallback: "_jc",
			cache: false,
			timeout: AJAX_TIMEOUT,
			success: function(data) {
				status = "connected";
				clientID = data.clientID;
				pollDomain = data.pollDomain;
				$(document).trigger("minitaur_connect");
				
				debug("success conn: " + data.clientID + " " + data.pollDomain);
				
				poll();
			},
			error: function(jqXHR, textStatus, errorThrown) {
				status = "disconnected";
				
				//setTimeout(connect, RECONNECT_TIMEOUT);
			
				debug(textStatus + ": " + errorThrown + " Recon... ");
				
				$(document).trigger("minitaur_disconnect");
			}
		});
	}

	function poll() {
		if(status === "connected" && pollDomain) {
			$.ajax({
				url: "http://" + pollDomain + ":8080/poll",
				data: {"clientID": clientID},
				dataType: 'jsonp',
				jsonpCallback: "_jc",
				cache: false,
				timeout: POLL_TIMEOUT,
				success: function(data) {
					if(data.messages) {
						$.each(data.messages, function (index, value) {
							$(document).trigger("minitaur_message", value);
						});
						
						
					}
					
					poll();
				},
				error: function(jqXHR, textStatus, errorThrown) {
					status = "disconnected";
					
					debug(textStatus + ": " + errorThrown + " Recon... ");
					
					$(document).trigger("minitaur_disconnect");
				}
			});
		}
	}
	
	function on(eventName, callback) {
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
	
	return {
		RECONNECT_TIMEOUT: RECONNECT_TIMEOUT,
		status: status,
		connect: connect,
		on: on
	};
}());
