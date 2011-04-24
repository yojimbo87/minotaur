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
	
	cint.init(
		$("#list-online"),
		$("#list-actors"),
		$("#active-actor"),
		$("#history"),
		$("#text-send"),
		$("#button-send")
	);
	
	minitaur.on("connect", function() {
		/*var chatArea = $("#area-chat");
        chatArea.append("<div class=\"msg\">Connected ...</div>");
        chatArea.scrollTop(chatArea[0].scrollHeight);*/
    });
    
    minitaur.on("message", function(data) {
		var chatArea = $("#area-chat");
	
		switch(data.cmd) {
            case "in":
				cint.attachOnlineUser({id: data.sid});
                break;
            case "out":
				cint.detachOnlineUser(data.sid);
                break;
            case "msg":
				/*chatArea.append(
					"<div class=\"msg\"><b>" + 
					data.sid + 
					"</b>: " + data.content + "</div>"
				);*/
                break;
            default:
                break;
        }
        chatArea.scrollTop(chatArea[0].scrollHeight);
    });
	
    minitaur.on("disconnect", function() {
		/*var chatArea = $("#area-chat");
	
        chatArea.append(
			"<div class=\"msg\">Disconnected, reconnecting ...</div>"
		);
        chatArea.scrollTop(chatArea[0].scrollHeight);*/
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

function generateString(sLength)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < sLength; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}