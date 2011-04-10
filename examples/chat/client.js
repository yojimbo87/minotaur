function debug(message) {
	$("#debug").append(message + "<br />");
}

$(document).ready(function () {
    debug("Ready<br />");
	
	minitaur.on("connect", function() {
        debug("on connect ");
    });
    
    minitaur.on("message", function(data) {
		if(data && data.cmd) {
			debug("on message " + data.cmd);
		}
    });
	
    minitaur.on("disconnect", function() {
        debug("on disconnect");
        //setTimeout(minitaur.connect, minitaur.RECONNECT_TIMEOUT);
    });
	
	minitaur.connect();
});

