var cint = (function(undefined) {
	var elementOnline,
		elementActors,
		elementActorTitle,
		elementActiveActor,
		elementHistory,
		elementInput,
		elementSubmit,
		users = {},
		usersCount = 0
		actors = {},
		actorsCount = 0;

/*------------------------------------------------------------------------------
  (public) init
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function init(
		onlineListElement, 
		actorsListElement,
		actorTitleElement,
		activeActorElement,
		historyElement,
		inputElement,
		submitElement
	) {
		elementOnline = onlineListElement;
		elementActors = actorsListElement;
		elementActorTitle = actorTitleElement;
		elementActiveActor = activeActorElement;
		elementHistory = historyElement;
		elementInput = inputElement;
		elementSubmit = submitElement;
		
		$("li", elementOnline).live("click", function() {
			var actorID = this.id.substring(2);
			attachActor(actorID, $(this).text());
			activateActor(actorID);
		});
		
		$("li", elementActors).live("click", function() {
			var actorID = this.id.substring(2);
			activateActor(actorID);
		});
		
		// bind button click event for sending message
		elementSubmit.click(function() {
			sendMessage();
		});
		
		// bind enter key event for sending message
		elementInput.keyup(function(e) {
			if(e.keyCode == 13) {
				sendMessage();
			}
		});
	}
	
/*------------------------------------------------------------------------------
  (public) attachOnlineUser
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function attachOnlineUser(userID, userName) {
		if(!users[userID]) {
			var user = {
				id: userID,
				name: userName
			};
		
			users[user.id] = user;
			usersCount++;
		
			$("<li id=\"o-" + user.id + "\">" +  user.name + "</li>").appendTo(elementOnline);
			$("#o-" + user.id).addClass("online");
			
			debug("Attached online " + user.id);
		}
	}
	
/*------------------------------------------------------------------------------
  (public) detachOnlineUser
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function detachOnlineUser(userID) {
		if(users[userID]) {
			usersCount--;
		
			$("#o-" + userID).remove();
			$("#a-" + userID).removeClass("online");
			$("#a-" + userID).addClass("offline");
			
			debug("Detached online " + userID);
		}
	}
	
/*------------------------------------------------------------------------------
  (public) attachActor
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function attachActor(actorID, actorName) {
		if(!actors[actorID]) {
			var actor = {
				id: actorID,
				name: actorName,
				history: []
			};
		
			actors[actor.id] = actor;
			actorsCount++;
			
			$("<li id=\"a-" + actor.id + "\">" +  actor.name + "</li>").appendTo(elementActors);
			$("#a-" + actor.id).addClass("online");
			
			debug("Attached actor " + actor.id);
		} else {
			$("#a-" + actorID).addClass("online");
		}
	}
	
/*------------------------------------------------------------------------------
  (public) detachActor
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function detachActor(actorID) {
		if(actors[actorID]) {
			actorsCount--;
		
			$("#a-" + actorID).remove();
			debug("Attached actor " + actorID);
		}
	}
	
/*------------------------------------------------------------------------------
  (public) addActorHistory
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function addActorHistory(actorID, message) {
		if(actors[actorID]) {
			actors[actorID].history.push(message);
		}
	}
	
/*------------------------------------------------------------------------------
  (public) activateActor
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function activateActor(actorID) {
		var i, len,
			history,
			messages = "",
			activeID = elementActiveActor.val();
		
		if(activeID !== actorID) {
			if(actors[actorID]) {
				elementActiveActor.val(actors[actorID].id);
				elementActorTitle.html(actors[actorID].name);
				
				$("li", elementActors).each(function(index) {
					$(this).removeClass("active");
				});
				
				var elementActor = $("#a-" + actorID);
				elementActor.addClass("active");
				
				if(elementActor.hasClass("unread")) {
					elementActor.removeClass("unread");
				}
				
				elementHistory.text("");
				history = actors[actorID].history;

				if(history.length > 0) {
					for(i = 0, len = history.length; i < len; i++) {
						messages += history[i];
					}

					elementHistory.html(messages);
					elementHistory.scrollTop(elementHistory[0].scrollHeight);
				}
				
				debug("Actor activated " + actors[actorID].id);
			}
		}
	}
	
/*------------------------------------------------------------------------------
  (public) sendMessage
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function sendMessage() {
		var activeID = elementActiveActor.val();
	
		if((elementInput.val() !== "empty") && (activeID !== "0")) {
			minitaur.send({
				"cmd": "msg", 
				"dest": activeID, 
				"content": elementInput.val()
			});
			elementInput.val("");
		}
	}
	
/*------------------------------------------------------------------------------
  (public) receiveMessage
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function receiveMessage(data) {
		var message,
			activeID = elementActiveActor.val();
	
		if(data) {
			switch(data.cmd) {
				case "msg":
					if(data.source === activeID) {
						if(data.me) {
							message = "<div class=\"msg-me\">" + data.content + "</div>";
						} else {
							message = "<div class=\"msg\">" + data.content + "</div>";
						}
						elementHistory.append(message);
						$("#history").scrollTop($("#history")[0].scrollHeight);
						addActorHistory(data.source, message);
					/*} else if(data.me) {
						
						elementHistory.append(message);
						$("#history").scrollTop($("#history")[0].scrollHeight);
						addActorHistory(data.source, message);*/
					} else {
						if($("#a-" + data.source).length === 0) {
							attachActor(data.source, $("#o-" + data.source).text());
						}
						
						if(data.me) {
							message = "<div class=\"msg-me\">" + data.content + "</div>";
						} else {
							message = "<div class=\"msg\">" + data.content + "</div>";
						}
						addActorHistory(data.source, message);
					
						$("#a-" + data.source).addClass("unread");
					}
					break;
				case "nameChange":
					var onlineUserElement = $("#o-" + data.id),
						actorElement = $("#a-" + data.id);
					
					if(users[data.id]) {
						users[data.id].name = data.name;
					}
					
					if(actors[data.id]) {
						actors[data.id].name = data.name;
					}
				
					if(onlineUserElement.length) {
						onlineUserElement.text(data.name);
					}
					
					if(actorElement.length) {
						actorElement.text(data.name);
					}
					
					if(elementActiveActor.val() === data.id) {
						elementActorTitle.html(data.name);
					}
					break;
				default:
					break;
			}
		}
	}
	
	return {
		init: init,
		attachOnlineUser: attachOnlineUser,
		detachOnlineUser: detachOnlineUser,
		attachActor: attachActor,
		detachActor: detachActor,
		activateActor: activateActor,
		sendMessage: sendMessage,
		receiveMessage: receiveMessage
	}
}());