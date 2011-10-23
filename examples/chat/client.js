function debug(message) {
	$("#debug").append(message + "<br />");
}

function sendMessage() {
	var textSend = $("#text-send");
    minitaur.send({"cmd": "msg", "content": textSend.val()});
    textSend.val("");
}

$(document).ready(function () {
	// client connects with server
	minitaur.on("connect", function() {
		var chatArea = $("#area-chat");
        chatArea.append("<div class=\"msg\">Connected ...</div>");
        chatArea.scrollTop(chatArea[0].scrollHeight);
    });
    
	// client receives a message
    minitaur.on("message", function(data) {
		var chatArea = $("#area-chat");

		switch(data.cmd) {
            case "in":
                chatArea.append(
					"<div class=\"msg\">" + 
					data.cid + 
					" connected!</div>"
				);
                break;
            case "out":
                chatArea.append(
					"<div class=\"msg\">" + 
					data.cid + 
					" disconnected!</div>"
				);
                break;
            case "msg":
				chatArea.append(
					"<div class=\"msg\"><b>" + 
					data.cid + 
					"</b>: " + data.content + "</div>"
				);
                break;
            default:
                break;
        }
        chatArea.scrollTop(chatArea[0].scrollHeight);
    });

	// client disconnects from server
    minitaur.on("disconnect", function() {
		var chatArea = $("#area-chat");
        chatArea.append(
			"<div class=\"msg\">Disconnected ...</div>"
		);
        chatArea.scrollTop(chatArea[0].scrollHeight);
    });

    // client error handler
    minitaur.on("error", function(data) {
		var chatArea = $("#area-chat");
        chatArea.append(
			"<div class=\"msg\">Error, type: " + data.type +
            ", message: " + data.message + "</div>"
		);
        chatArea.scrollTop(chatArea[0].scrollHeight);
    });
    
	// initiate client connection with server
	minitaur.connect({
		host: "my.domain.com:8080"
	});

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