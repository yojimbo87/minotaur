var cint = (function(undefined) {
	var elementOnline,
		elementActors,
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
		activeActorElement,
		historyElement,
		inputElement,
		submitElement
	) {
		elementOnline = onlineListElement;
		elementActors = actorsListElement;
		elementActiveActor = activeActorElement;
		elementHistory = historyElement;
		elementInput = inputElement;
		elementSubmit = submitElement;
		
		$("li", elementOnline).live("click", function() {
			var actor = {
				id: this.id.substring(2)
			};
			
			attachActor(actor);
		});
		
		$("li", elementActors).live("click", function() {
			var actorID = this.id.substring(2),
				activeElement = $("#x-" + actorID),
				activeID = "0";
				
			if(activeElement && activeElement.attr("id")) {
				activeID = activeElement.attr("id").substring(2);
			}
			
			if(actorID !== activeID) {
				activateActor(actorID);
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
			
			activateActor(actor.id);
			
			debug("Attached actor " + actor.id);
		}
	}
	
/*------------------------------------------------------------------------------
  (public) attachActor
  
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
  (public) activateActor
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function activateActor(id) {
		if(actors[id]) {
			elementActiveActor.html("Chatting with <span id=\"x-" + actors[id].id + "\">" + actors[id].id + "</span></b>");
			elementHistory.text("");
			
			debug("Actor activated " + actors[id].id);
		}
	}
	
	return {
		init: init,
		attachOnlineUser: attachOnlineUser,
		detachOnlineUser: detachOnlineUser,
		attachActor: attachActor,
		detachActor: detachActor,
		activateActor: activateActor
	}
}());