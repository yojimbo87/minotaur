var mini = new Minitaur();
    
$(document).ready(function() {
    mini.connect();
    mini.on("message", function(data) {
        switch(data.cmd) {
            case "in":
                $("#area-chat").append("<div class=\"msg\">" + data.id + " connected!</div>");
                break;
            case "out":
                $("#area-chat").append("<div class=\"msg\">" + data.id + " disconnected!</div>");
                break;
            case "msg":
                $("#area-chat").append("<div class=\"msg\"><b>" + data.id + "</b>: " + data.content + "</div>");
                break;
            default:
                break;
        }
        $("#area-chat").scrollTop($("#area-chat").height());
    });
    mini.on("disconnect", function() {
        $("#area-chat").append("<div class=\"msg\">Disconnected, reconnecting ...</div>");
        $("#area-chat").scrollTop($("#area-chat").height());
        setTimeout("mini.connect()", 10000);
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

function sendMessage() {
    mini.send($("#text-send").val());
    
    $("#text-send").val("");
}

function debug(msg) {
    $("#debug").append(msg + "<br />");
}