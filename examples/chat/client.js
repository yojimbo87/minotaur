function debug(message) {
	$("#debug").append(message + "<br />");
}

function sendMessage() {
	var textSend = $("#text-send");

    minitaur.send({"cmd": "msg", "content": textSend.val()});
    
    textSend.val("");
}

/*var iteration = 1,
	previousIteration = 2;*/

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
				/*var result = parseInt(previousIteration, 10) + 1;
				if(result == data.iteration) {
					chatArea.append(
						"<div class=\"msg\"><b>" + 
						data.sid + 
						"</b>: " + data.iteration + " - " + data.content + "</div>"
					);
				} else {
					chatArea.append(
						"<div class=\"msg\"><b>" + 
						data.sid + 
						"</b>: <i>!!!!!!!!!!!!!!!!!! " + data.iteration + " - " + data.content + " !!!!!!!!!!!!</i></div>"
					);
				}
				previousIteration = data.iteration;*/
				
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
	
	/*$("#button-generate").click(function() {
        iterate();
    });*/
});

/*function iterate() {
	var randomTimeout = Math.floor(Math.random()*11) * 1000 + 1000,
		randomStringLength = Math.floor(Math.random()*20) + 3;
	
	setTimeout(function() {
		iteration++;
		minitaur.send({"cmd": "msg", "content": generateString(randomStringLength), "iteration": iteration});
		
		iterate();
	}, randomTimeout);
}

function generateString(sLength)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < sLength; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}*/