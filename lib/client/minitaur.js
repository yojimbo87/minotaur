var minitaur = (function (undefined) {
	var AJAX_TIMEOUT = 1000 * 20,
		POLL_TIMEOUT = 1000 * 15,
		RECONNECT_TIMEOUT = 1000 * 15,
		status = "disconnected",
		isLocalStorageUsed = false,
		pollHandler,
		clientID,
		localID,
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
					
					if(isLocalStorageUsed) {
						localStorage.setItem(
							"minitaur_pollDomain",
							pollDomain
						);
					}
					
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
  (private) parseItemValue
  
  + messages - array of messages
  - messages - messages with additional timestamp at the end
  
  Add timestamp to messages to make the object "unique".
------------------------------------------------------------------------------*/
	function parseItemValue(messages) {
		var timestamp = ",{\"cmd\": \"timestamp\", \"value\": " + 
						"\"" + new Date().getTime() + "\"}]";
		return messages.substring(0, messages.length - 1) + timestamp;
	}
	
/*------------------------------------------------------------------------------
  (public) init
  
  + none
  - void
  
  Initialize minitaur client.
  
  TODO:
  - options parameter
------------------------------------------------------------------------------*/
	function init() {
		var connectionStatus;
		
		localID = uuid();
		
		if($.browser.webkit || $.browser.mozilla) {
			isLocalStorageUsed = true;
			connectionStatus = localStorage.getItem("minitaur_status");
			
			if(connectionStatus && (connectionStatus === "connected")) {
				status = "connected";
				localStorage.setItem("minitaur_lastLocalID", localID);
				
				debug("Other tab is polling");
			} else {
				connect();
			}
		} else {
			connect();
		}
	}
	
/*------------------------------------------------------------------------------
  (public) connect
  
  + none
  - void
  
  Connect minitaur client with minotaur server and starts polling.
------------------------------------------------------------------------------*/
	function connect() {
		$.ajax({
			url: "http://master.developmententity.sk:8080/connect",
			dataType: "jsonp",
			jsonp: false,
			jsonpCallback: "_jsnpcb",
			cache: false,
			timeout: AJAX_TIMEOUT,
			success: function(data) {
				var continuePolling = true;
				
				if(data.messages) {
					continuePolling = parseMessages(data.messages);
					
					if(isLocalStorageUsed) {
						localStorage.setItem(
							"minitaur_pollingLocalID", 
							localID
						);
						localStorage.setItem(
							"minitaur_messages", 
							parseItemValue(JSON.stringify(data.messages))
						);
					}
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
				url: "http://" + pollDomain + ":8080/poll",
				data: {"clientID": clientID},
				dataType: "jsonp",
				jsonp: false,
				jsonpCallback: "_jsnpcb",
				cache: false,
				timeout: POLL_TIMEOUT,
				success: function(data) {
					var continuePolling = true;
					
					if(data.messages) {
						continuePolling = parseMessages(data.messages);
						
						if(isLocalStorageUsed) {
							localStorage.setItem(
								"minitaur_messages", 
								parseItemValue(JSON.stringify(data.messages))
							);
						}
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
				url: "http://" + pollDomain + ":8080/disc",
				data: {"clientID": clientID},
				dataType: "jsonp",
				jsonp: false,
				jsonpCallback: "_jsnpsnd",
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
		if(isLocalStorageUsed) {
			pollDomain = localStorage.getItem("minitaur_pollDomain");
		}
	
		if((status === "connected") && (data !== "")) {
			$.ajax({
				url: "http://" + pollDomain + ":8080/msg",
				data: data,
				dataType: "jsonp",
				jsonp: false,
				jsonpCallback: "_jsnpsnd",
				cache: false,
				timeout: AJAX_TIMEOUT,
				success: function(data) {
					if(data.messages) {
						parseMessages(data.messages);
						
						if(isLocalStorageUsed) {
							localStorage.setItem(
								"minitaur_messages", 
								parseItemValue(JSON.stringify(data.messages))
							);
						}
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
					if(isLocalStorageUsed) {
						localStorage.setItem("minitaur_status", "connected");
					}
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
					if(isLocalStorageUsed) {
						localStorage.setItem("minitaur_status", "disconnected");
					}
                    callback();
                });
                break;
            default:
                break;
        }
    }
	
/*------------------------------------------------------------------------------
  (public) processUnload
  
  + none
  - void
  
  Process client unload.
------------------------------------------------------------------------------*/
	function processUnload() {
		if(isLocalStorageUsed) {
			if(localStorage.getItem("minitaur_pollingLocalID") === localID) {
				localStorage.setItem(
					"minitaur_initConnect", 
					new Date().getTime()
				);
			}
			
			if(localStorage.getItem("minitaur_lastLocalID") === localID) {
				localStorage.setItem(
					"minitaur_initReshufle", 
					new Date().getTime()
				);
			}
		}
	}
	
/*------------------------------------------------------------------------------
  (public) processStorageEvent
  
  + eventKey
  + eventValue
  - void
  
  Process local storage event relevant to minitaur.
------------------------------------------------------------------------------*/
	function processStorageEvent(eventKey, eventValue) {
		switch(eventKey) {
			case "minitaur_status":
				debug("Status: " + eventValue);
				break;
			case "minitaur_messages":
				parseMessages(JSON.parse(eventValue));
				break;
			case "minitaur_initConnect":
				if(localStorage.getItem("minitaur_lastLocalID") === localID) {
					connect();
				} else {
					localStorage.setItem("minitaur_lastLocalID", localID);
				}
				break;
			case "minitaur_initReshufle":
				if(localStorage.getItem("minitaur_pollingLocalID") !== 
				   localID) {
					localStorage.setItem("minitaur_lastLocalID", localID);
				}
				break;
			default:
				break;
		}
	}
	
	return {
		RECONNECT_TIMEOUT: RECONNECT_TIMEOUT,
		status: status,
		processUnload: processUnload,
		processStorageEvent: processStorageEvent,
		init: init,
		connect: connect,
		disconnect: disconnect,
		send: send,
		on: on
	}
}());

(function() {
  /*
  * Generate a RFC4122(v4) UUID
  *
  * Documentation at https://github.com/broofa/node-uuid
  */

  // Use node.js Buffer class if available, otherwise use the Array class
  var BufferClass = typeof(Buffer) == 'function' ? Buffer : Array;

  // Buffer used for generating string uuids
  var _buf = new BufferClass(16);

  // Cache number <-> hex string for octet values
  var toString = [];
  var toNumber = {};
  for (var i = 0; i < 256; i++) {
    toString[i] = (i + 0x100).toString(16).substr(1).toUpperCase();
    toNumber[toString[i]] = i;
  }

  function parse(s) {
    var buf = new BufferClass(16);
    var i = 0, ton = toNumber;
    s.toUpperCase().replace(/[0-9A-F][0-9A-F]/g, function(octet) {
      buf[i++] = toNumber[octet];
    });
    return buf;
  }

  function unparse(buf) {
    var tos = toString, b = buf;
    return tos[b[0]] + tos[b[1]] + tos[b[2]] + tos[b[3]] + '-' +
           tos[b[4]] + tos[b[5]] + '-' +
           tos[b[6]] + tos[b[7]] + '-' +
           tos[b[8]] + tos[b[9]] + '-' +
           tos[b[10]] + tos[b[11]] + tos[b[12]] +
           tos[b[13]] + tos[b[14]] + tos[b[15]];
  }

  function uuid(fmt, buf, offset) {
    var b32 = 0x100000000, ff = 0xff;

    var b = fmt != 'binary' ? _buf : (buf ? buf : new BufferClass(16));
    var i = buf && offset || 0;

    r = Math.random()*b32;
    b[i++] = r & ff;
    b[i++] = (r=r>>>8) & ff;
    b[i++] = (r=r>>>8) & ff;
    b[i++] = (r=r>>>8) & ff;
    r = Math.random()*b32;
    b[i++] = r & ff;
    b[i++] = (r=r>>>8) & ff;
    b[i++] = (r=r>>>8) & 0x0f | 0x40; // See RFC4122 sect. 4.1.3
    b[i++] = (r=r>>>8) & ff;
    r = Math.random()*b32;
    b[i++] = r & 0x3f | 0x80; // See RFC4122 sect. 4.4
    b[i++] = (r=r>>>8) & ff;
    b[i++] = (r=r>>>8) & ff;
    b[i++] = (r=r>>>8) & ff;
    r = Math.random()*b32;
    b[i++] = r & ff;
    b[i++] = (r=r>>>8) & ff;
    b[i++] = (r=r>>>8) & ff;
    b[i++] = (r=r>>>8) & ff;

    return fmt === undefined ? unparse(b) : b;
  };

  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;

  if (typeof(module) != 'undefined') {
    module.exports = uuid;
  } else {
    // In browser? Set as top-level function
    this.uuid = uuid;
  }
})();