var cint = (function(undefined) {
	var elementOnline,
		elementActors,
		elementActorTitle,
		elementActiveActor,
		elementHistory,
		elementInput,
		elementSubmit,
		users = {},
		usersCount = 0;

/*------------------------------------------------------------------------------
  (public) init
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function init(
		userListItemTemplate,
		messageTemplate,
		onlineListElement, 
		actorsListElement,
		actorTitleElement,
		activeActorElement,
		historyElement,
		inputElement,
		submitElement
	) {
		tmplUserListItem = userListItemTemplate;
		tmplMessage = messageTemplate;
		elementOnline = onlineListElement;
		elementActors = actorsListElement;
		elementActorTitle = actorTitleElement;
		elementActiveActor = activeActorElement;
		elementHistory = historyElement;
		elementInput = inputElement;
		elementSubmit = submitElement;
		
		$("li", elementOnline).live("click", function() {
			var userID = this.id.substring(2);
			activateUser(userID);
		});
		
		$("li", elementActors).live("click", function() {
			var userID = this.id.substring(2);
			activateUser(userID);
		});
		
		// bind button click event for sending message
		elementSubmit.click(function() {
			sendMessage();
		});
		
		// bind enter key event for sending message
		elementInput.keyup(function(e) {
			var code = (e.keyCode ? e.keyCode : e.which);
			if(code == 13) {
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
	function attachUser(user) {
		if(!users[user.id]) {
			var newUser = {
				id: user.id,
				name: user.name || user.id,
				status: "online",
				isListed: false,
				history: []
			};
		
			users[user.id] = newUser;
			usersCount++;
		
			tmplUserListItem.tmpl(newUser).appendTo(elementOnline);
			
			debug("Attached user " + newUser.id);
		}
	}
	
/*------------------------------------------------------------------------------
  (public) detachOnlineUser
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function detachUser(userID) {
		var user = users[userID],
			elementA = $("#a-" + userID),
			elementO = $("#o-" + userID),
			activeID = elementActiveActor.val();
	
		if(user) {
			if(user.isListed) {
				user.status = "offline";
				
				if(user.id === activeID) {
					tmplMessage.tmpl({
						me: false,
						name: user.name,
						content: "OFFLINE"
					}).appendTo(elementHistory);
				}
				addUserHistory(
					userID, 
					"<div class=\"msg\">" +
					"<span class=\"name\">" + user.name + ": </span>" +
					"OFFLINE</div>"
				);
				
				elementA.removeClass("online");
				elementA.addClass("offline");
				
				elementO.removeClass("online");
				elementO.addClass("offline");
			} else {
				delete users[userID];
				usersCount--;
				
				elementO.remove();
				elementA.remove();
				
				debug("Detached user " + userID);
			}
		}
	}
	
/*------------------------------------------------------------------------------
  (public) addUserHistory
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function addUserHistory(userID, message) {
		if(users[userID]) {
			users[userID].history.push(message);
		}
	}
	
/*------------------------------------------------------------------------------
  (public) activateActor
  
  + 
  - 
  
  .
------------------------------------------------------------------------------*/
	function activateUser(userID) {
		var i, len,
			history,
			elementUser,
			user = users[userID],
			messages = "",
			activeID = elementActiveActor.val();
		
		if(user) {
			// if users is not in chatters list
			if($("#a-" + userID).length === 0) {
				user.isListed = true;
				tmplUserListItem.tmpl(user).appendTo(elementActors);
			}
		
			if(activeID !== userID) {
				elementActiveActor.val(user.id);
				elementActorTitle.html(user.name);
				
				$("li", elementActors).each(function(index) {
					$(this).removeClass("active");
				});
				
				elementUser = $("#a-" + userID);
				elementUser.addClass("active");
				
				if(elementUser.hasClass("unread")) {
					elementUser.removeClass("unread");
				}
				
				elementHistory.text("");
				history = user.history;

				if(history.length > 0) {
					for(i = 0, len = history.length; i < len; i++) {
						messages += history[i];
					}

					elementHistory.html(messages);
					elementHistory.scrollTop(elementHistory[0].scrollHeight);
				}
				
				debug("Actor activated " + users[userID].id);
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
			if(users[activeID].status !== "offline") {
				minitaur.send({
					"cmd": "msg", 
					"dest": activeID, 
					"content": elementInput.val()
				});
				elementInput.val("");
			}
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
			user,
			activeID = elementActiveActor.val();
	
		if(data) {
			switch(data.cmd) {
				case "msg":
					user = users[data.source];
					
					if(data.me) {
						message = "<div class=\"msg-me\">" +
						"<span class=\"name\">me: </span>" +
						data.content + "</div>";
					} else {
						message = "<div class=\"msg\">" +
						"<span class=\"name\">" + user.name +": </span>" +
						data.content + "</div>";
					}
					// received message belongs to active conversation
					if(user.id === activeID) {
						tmplMessage.tmpl({
							me: data.me,
							name: user.name,
							content: data.content
						}).appendTo(elementHistory);
						
						$("#history").scrollTop($("#history")[0].scrollHeight);
						addUserHistory(user.id, message);
					} else {
						if($("#a-" + user.id).length === 0) {
							user.isListed = true;
							tmplUserListItem.tmpl(user).appendTo(elementActors);
						}
						
						addUserHistory(user.id, message);
					
						$("#a-" + user.id).addClass("unread");
					}
					break;
				case "nameChange":
					var onlineUserElement = $("#o-" + data.id),
						actorElement = $("#a-" + data.id);
					
					if(users[data.id]) {
						users[data.id].name = data.name;
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
		attachUser: attachUser,
		detachUser: detachUser,
		activateUser: activateUser,
		sendMessage: sendMessage,
		receiveMessage: receiveMessage
	}
}());