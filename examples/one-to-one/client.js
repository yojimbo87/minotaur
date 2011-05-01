function debug(message) {
	$("#debug").append(message + "<br />");
}


$(document).ready(function () {
    debug("Ready<br />");
	
	cint.init(
		$("#tmpl-li-user"),
		$("#tmpl-message"),
		$("#list-online"),
		$("#list-actors"),
		$("#active-actor"),
		$("#hidden-actor"),
		$("#history"),
		$("#text-send"),
		$("#button-send")
	);
	
	minitaur.on("connect", function() {
		debug("connected");
		
		minitaur.send({cmd: "getName"});
    });
    
    minitaur.on("message", function(data) {
		var chatArea = $("#area-chat");
	
		switch(data.cmd) {
            case "in":
				cint.attachUser({
					id: data.id,
					name: data.name
				});
                break;
            case "out":
				cint.detachUser(data.id);
                break;
			case "getName":
				$("#text-name").val(data.name);
				break;
			case "nameChange":
				cint.receiveMessage(data);
				break;
            case "msg":
				cint.receiveMessage(data);
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
		debug("disconnected");
    });
	
	minitaur.connect();
	
	$("#button-name").click(function() {
		minitaur.send({cmd: "setName", name: $("#text-name").val()});
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