var minitaur = (function (document, undefined) {
    var _status = "disconnected",
        _AJAX_TIMEOUT,
		_POLL_TIMEOUT,
		_pollHandler,
		_clientID,
		_pollDomain;

    /*--------------------------------------------------------------------------
      (private) _parseMessages
      
      + messages - array of messages to be parsed
      - continuePolling - boolean indicating if polling should continue
      
      Parse messages received from server side.
    --------------------------------------------------------------------------*/
	function _parseMessages(messages) {
		var continuePolling = true,
            message, i, len;

        for(i = 0, len = messages.length; i < len; i++) {
            message = messages[i];
            
            switch(message.cmd) {
				case "con_ok":
					_status = "connected";
					_clientID = message.payload.clientID;
					_pollDomain = message.payload.pollDomain;
					$(document).trigger("minitaur_connect");
					break;
				case "poll":
					//debug("poll " + message.cmd);
					break;
				case "con_err":
				case "poll_err":
					continuePolling = false;
					break;
				default:
					$(document).trigger("minitaur_message", message);
					break;
			}
        }

		return continuePolling;
	}
    
    /*--------------------------------------------------------------------------
      (private) _poll
      
      + none
      - void
      
      Client side long poll processing.
    --------------------------------------------------------------------------*/
	function _poll() {
		if(_status === "connected" && _pollDomain) {
			_pollHandler = $.ajax({
				url: "http://" + _pollDomain + "/minotaur_poll",
				data: {"clientID": _clientID},
				dataType: "jsonp",
				cache: false,
				timeout: _POLL_TIMEOUT,
				success: function(data) {
					if(data.messages && _parseMessages(data.messages)) {
						_poll();
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {	
					$(document).trigger("minitaur_disconnect");
                    $(document).trigger("minitaur_error", {
                        type: "poll ajax error",
                        message: textStatus + ": " + errorThrown
                    });
				}
			});
		}
	}
        
    /*--------------------------------------------------------------------------
      (public) connect
      
      + options- {host, ajaxTimeout, pollTimeout, credentials}
      - void
      
      Connect client with the server based on options.
    --------------------------------------------------------------------------*/
    function connect(options) {
        _AJAX_TIMEOUT = options.ajaxTimeout || 35000;
        _POLL_TIMEOUT = options.pollTimeout || 30000;
    
        $.ajax({
			url: "http://" + options.host + "/minotaur_connect",
            data: options.credentials,
			dataType: "jsonp",
			cache: false,
			timeout: _AJAX_TIMEOUT,
			success: function(data) {
				if(data.messages && _parseMessages(data.messages)) {					
					_poll();
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				$(document).trigger("minitaur_disconnect");
                $(document).trigger("minitaur_error", {
                    type: "connect ajax error",
                    message: textStatus + ": " + errorThrown
                });
			}
		});
    }
    
    /*--------------------------------------------------------------------------
      (public) send
      
      + data - data to be sent to server
      - void
      
      Sending data to server.
    --------------------------------------------------------------------------*/
	function send(data) {	
		if((_status === "connected") && (data !== "")) {
			data["clientID"] = _clientID;

			$.ajax({
				url: "http://" + _pollDomain + "/minotaur_message",
				data: data,
				dataType: "jsonp",
				cache: false,
				timeout: _AJAX_TIMEOUT,
				success: function(receivedData) {
					if(receivedData && receivedData.messages) {
						_parseMessages(receivedData.messages);
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
                    $(document).trigger("minitaur_error", {
                        type: "send ajax error",
                        message: textStatus + ": " + errorThrown
                    });
				}
			});
        }
	}
    
    /*--------------------------------------------------------------------------
      (public) on
      
      + eventName - name of the event which should client listen to
      - callback - will be called when event occurs
      
      Starts listening to specified events and invoking callbacks.
    --------------------------------------------------------------------------*/
	function on(eventName, callback) {
        switch(eventName) {
            case "connect":
	            $(document).bind("minitaur_connect", function(event) {
					_status = "connected";

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
					_status = "disconnected";

                    callback();
                });
                break;
            case "error":
                $(document).bind("minitaur_error", function(event, data) {
                    callback(data);
                });
                break;
            default:
                break;
        }
    }
    
    return {
        connect: connect,
        send: send,
        on: on
	}
}(document));