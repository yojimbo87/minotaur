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
			var actor = {
				id: this.id.substring(2),
				history: []
			};
			
			attachActor(actor);
			//if(actor.id !== activeID) {
				activateActor(actor.id);
			//}
		});
		
		$("li", elementActors).live("click", function() {
			var actorID = this.id.substring(2);
				//activeID = elementActiveActor.val();
			
			//if(actorID !== activeID) {
				activateActor(actorID);
			//}
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
	function attachOnlineUser(user) {
		if(!users[user.id]) {
			users[user.id] = user;
			usersCount++;
		
			$("<li id=\"o-" + user.id + "\">" +  user.id + "</li>").appendTo(elementOnline);
			debug("Attached online " + user.id);
		}
	}
	
/*------------------------------------------------------------------------------
  (public) detachOnlineUser
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function detachOnlineUser(id) {
		if(users[id]) {
			usersCount--;
		
			$("#o-" + id).remove();
			debug("Detached online " + id);
		}
	}
	
/*------------------------------------------------------------------------------
  (public) attachActor
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function attachActor(actor) {
		if(!actors[actor.id]) {
			actors[actor.id] = actor;
			actorsCount++;
			
			$("<li id=\"a-" + actor.id + "\">" +  actor.id + "</li>").appendTo(elementActors);
			
			debug("Attached actor " + actor.id);
		}
	}
	
/*------------------------------------------------------------------------------
  (public) detachActor
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function detachActor(id) {
		if(actors[id]) {
			actorsCount--;
		
			$("#a-" + id).remove();
			debug("Attached actor " + id);
		}
	}
	
/*------------------------------------------------------------------------------
  (public) addActorHistory
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function addActorHistory(id, message) {
		if(actors[id]) {
			actors[id].history.push(message);
		}
	}
	
/*------------------------------------------------------------------------------
  (public) activateActor
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function activateActor(id) {
		var i, len,
			history,
			messages = "",
			activeID = elementActiveActor.val();
		
		if(activeID !== id) {
			if(actors[id]) {
				elementActiveActor.val(actors[id].id);
				elementActorTitle.html("Chatting with <b>" + actors[id].id + "</b>");
				
				var elementActor = $("#a-" + id);
				if(elementActor.hasClass("active")) {
					elementActor.removeClass("active");
				}
				
				elementHistory.text("");
				history = actors[id].history;

				if(history.length > 0) {
					for(i = 0, len = history.length; i < len; i++) {
						messages += history[i];
					}

					elementHistory.html(messages);
					$("#history").scrollTop($("#history")[0].scrollHeight);
				}
				
				debug("Actor activated " + actors[id].id);
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
	
		if((elementInput.val() !== "") && (activeID !== "0")) {
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
		var activeID = elementActiveActor.val();
	
		if(data && data.source && data.content) {
			if(data.source === activeID) {
				var message = "<div class=\"msg\">" + data.content + "</div>";
				elementHistory.append(message);
				$("#history").scrollTop($("#history")[0].scrollHeight);
				addActorHistory(activeID, message);
			} else if(data.source === "me") {
				var message = "<div class=\"msg-me\">" + data.content + "</div>";
				elementHistory.append(message);
				$("#history").scrollTop($("#history")[0].scrollHeight);
				addActorHistory(activeID, message);
			} else {
				if($("#a-" + data.source).length === 0) {
					attachActor({id: data.source, history: []});
				}
				
				var message = "<div class=\"msg\">" + data.content + "</div>";
				addActorHistory(data.source, message);
			
				$("#a-" + data.source).addClass("active");
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