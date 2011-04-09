var minitaur = (function (undefined) {
	var AJAX_TIMEOUT = 1000 * 10,
		POLL_TIMEOUT = 1000 * 3,
		RECONNECT_TIMEOUT = 1000 * 15,
		status = "disconnected";

	function connect() {
		$.ajax({
			url: "http://master.developmententity.sk:8080/connect",
			dataType: 'jsonp',
			jsonpCallback: "_jc",
			cache: false,
			timeout: AJAX_TIMEOUT,
			success: function(data) {
				status = "connected";
				debug("success conn: " + data.clientID + " " + data.pollDomain);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				status = "disconnected";
				
				//setTimeout(connect, RECONNECT_TIMEOUT);
			
				debug(textStatus + ": " + errorThrown + " Recon... ");
			}
		});
	}

	function poll() {
		/*$.ajax({
			type: "POST",
			url: "poll",
			contentType: "application/x-www-form-urlencoded",
			data: {foo: "poll", bar: "pol"},
			cache: false,
			timeout: AJAX_TIMEOUT,
			success: function (msg) {
				debug("success poll: " + msg.foo);
				
				setTimeout(poll, POLL_TIMEOUT);
			},
			failure: function (jqXHR, textStatus, errorThrown) {
				status = "disconnected";
				
				
			
				debug(textStatus + ": " + errorThrown + " Recon... ");
			}
		});*/
	}
	
	return {
		connect: connect,
		poll: poll
	};
}());
