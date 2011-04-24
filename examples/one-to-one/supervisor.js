var util = require("util");

/*------------------------------------------------------------------------------
  (public) Supervisor
  
  + none
  - void
  
  Set up session Supervisor for chat.
------------------------------------------------------------------------------*/
var Supervisor = module.exports = function Supervisor() {
	
	this._users = {};
	
	this._usersCount = 0;
};

Supervisor.prototype.attachUser = function(user) {
    this._users[user.hash] = user;
    this._usersCount++;
};

Supervisor.prototype.detachUser = function(userHash) {
    delete this._users[userHash];
    this._usersCount--;
};

Supervisor.prototype.forEachUser = function(callback) {
	var item;

    for(item in this._users) {
		if(this._users.hasOwnProperty(item)) {
			callback(this._users[item]);
		}
    }
};