function debug(message) {
	$("#debug").append(message + "<br />");
}

function sendMessage() {
	var textSend = $("#text-send");

    minitaur.send({"cmd": "msg", "content": textSend.val()});
    
    textSend.val("");
}

$(document).ready(function () {
    debug("Ready<br />");
	
	minitaur.on("connect", function() {
		var chatArea = $("#area-chat");
	
        chatArea.append("<div class=\"msg\">Connected ...</div>");
        chatArea.scrollTop(chatArea[0].scrollHeight);
    });
    
    minitaur.on("message", function(data) {
		var chatArea = $("#area-chat");
	
		switch(data.cmd) {
            case "in":
                chatArea.append(
					"<div class=\"msg\">" + 
					data.sid + 
					" connected!</div>"
				);
                break;
            case "out":
                chatArea.append(
					"<div class=\"msg\">" + 
					data.sid + 
					" disconnected!</div>"
				);
                break;
            case "msg":
                chatArea.append(
					"<div class=\"msg\"><b>" + 
					data.sid + 
					"</b>: " + data.content + "</div>"
				);
                break;
            default:
                break;
        }
        chatArea.scrollTop(chatArea[0].scrollHeight);
    });
	
    minitaur.on("disconnect", function() {
		var chatArea = $("#area-chat");
	
        chatArea.append(
			"<div class=\"msg\">Disconnected, reconnecting ...</div>"
		);
        chatArea.scrollTop(chatArea[0].scrollHeight);
        //setTimeout(minitaur.connect, 10000);
    });
	
	minitaur.connect();
	
	// bind button click event for sending message
    $("#button-send").click(function() {
        sendMessage();
    });
    
    // bind enter key event for sending message
    $("#text-send").keyup(function(e) {
        if(e.keyCode == 13) {
            sendMessage();
        }
    });
});

