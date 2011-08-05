var minitaur = (function (undefined) {
	var AJAX_TIMEOUT = 1000 * 35,
		POLL_TIMEOUT = 1000 * 30,
		status = "disconnected",
		pollHandler,
		clientID,
		pollDomain;

/*------------------------------------------------------------------------------
  (private) parseMessages
  
  + messages - array of messages to be parsed
  - continuePolling - boolean indicating if polling should continue
  
  Parse messages received from server side.
------------------------------------------------------------------------------*/
	function parseMessages(messages) {
		var continuePolling = true;
		
		$.each(messages, function (index, value) {
			switch(value.cmd) {
				case "client_begin":
					status = "connected";
					clientID = value.clientID;
					pollDomain = value.pollDomain;
					$(document).trigger("minitaur_connect");
					
					debug("success conn: " + value.clientID + " " + value.pollDomain);
					break;
				case "poll":
				case "mess_ok":
				case "mess_err":
					debug("poll" + value.cmd);
					break;
				case "conn_err":
				case "poll_cli_inv":
				case "poll_ses_inv":
				case "poll_err":
					continuePolling = false;
					break;
				default:
					$(document).trigger("minitaur_message", value);
					break;
			}
		});
		
		return continuePolling;
	}
	
/*------------------------------------------------------------------------------
  (public) connect
  
  + none
  - void
  
  Connect minitaur client with minotaur server and starts polling.
------------------------------------------------------------------------------*/
	function connect(options) {
		$.ajax({
			url: "http://" + options.host + "/connect",
			dataType: "jsonp",
			cache: false,
			timeout: AJAX_TIMEOUT,
			success: function(data) {
				var continuePolling = true;
				
				if(data.messages) {
					continuePolling = parseMessages(data.messages);
				}
				
				if(continuePolling) {					
					poll();
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				$(document).trigger("minitaur_disconnect");
				
				debug(textStatus + ": " + errorThrown + " conn");
			}
		});
	}

/*------------------------------------------------------------------------------
  (public) poll
  
  + none
  - void
  
  Client side long poll processing.
------------------------------------------------------------------------------*/
	function poll() {
		if(status === "connected" && pollDomain) {
			pollHandler = $.ajax({
				url: "http://" + pollDomain + "/poll",
				data: {"clientID": clientID},
				dataType: "jsonp",
				cache: false,
				timeout: POLL_TIMEOUT,
				success: function(data) {
					var continuePolling = true;
					
					if(data.messages) {
						continuePolling = parseMessages(data.messages);
					}
					
					if(continuePolling) {
						poll();
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {	
					$(document).trigger("minitaur_disconnect");
					
					debug(textStatus + ": " + errorThrown + " poll");
				}
			});
		}
	}

/*------------------------------------------------------------------------------
  (public) disconnect
  
  + none
  - void
  
  Disconnects client.
------------------------------------------------------------------------------*/
	function disconnect() {
		if((status === "connected")) {
			$.ajax({
				url: "http://" + pollDomain + "/disc",
				data: {"clientID": clientID},
				dataType: "jsonp",
				cache: false,
				timeout: AJAX_TIMEOUT,
				success: function(data) {
					if(pollHandler) {
						pollHandler.abort();
						
						$(document).trigger("minitaur_disconnect");
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					debug(textStatus + ": " + errorThrown + " disc");
				}
			});
        }
	}

/*------------------------------------------------------------------------------
  (public) send
  
  + data - data to be sent to server
  - void
  
  Sending data to server.
------------------------------------------------------------------------------*/
	function send(data) {	
		if((status === "connected") && (data !== "")) {
			data["clientID"] = clientID;
		
			$.ajax({
				url: "http://" + pollDomain + "/msg",
				data: data,
				dataType: "jsonp",
				cache: false,
				timeout: AJAX_TIMEOUT,
				success: function(receivedData) {
					if(receivedData && receivedData.messages) {
						parseMessages(receivedData.messages);
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					debug(textStatus + ": " + errorThrown + " mess");
				}
			});
        }
	}

/*------------------------------------------------------------------------------
  (public) on
  
  + eventName - name of the event which should client listen to
  - callback - will be called when event occurs
  
  Starts listening to specified events and invoking callbacks.
------------------------------------------------------------------------------*/
	function on(eventName, callback) {
        switch(eventName) {
            case "connect":
	            $(document).bind("minitaur_connect", function(event) {
					status = "connected";

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
					status = "disconnected";

                    callback();
                });
                break;
            default:
                break;
        }
    }
	
	return {
		status: status,
		connect: connect,
		disconnect: disconnect,
		send: send,
		on: on
	}
}());