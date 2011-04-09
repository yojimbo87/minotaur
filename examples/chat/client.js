function debug(message) {
	$("#debug").append(message + "<br />");
}

$(document).ready(function () {
    debug("Ready<br />");
	
	minitaur.connect();
});

