var sys = require("util"),
   uuid = require("../node-uuid/uuid"),
   sess = require("./session");

var debug;

/*-----------------------------------------------
  Connection Manager
-----------------------------------------------*/
module.exports = Manager;

function Manager(showDebug) {
    if(showDebug) {
        debug = function() {
            sys.log("\033[31mManager: " + 
            Array.prototype.join.call(arguments, ", ") + 
            "\033[39m"); 
        };
    } else {
        debug = function(){};
    }
  
    this._head = null;
    this._tail  = null;
    // number of connected sessions
    this._length = 0;
    // counter for generating unique session IDs
    this._sessionCounter = 0;
};

Object.defineProperty(Manager.prototype, "length", {
    get: function() {
        return this._length;
    }
});

Manager.prototype.createGUID = function() {
    return uuid();
};

Manager.prototype.attachSession = function(sid, response, callback) {
    var session = new sess(sid);
    var token = uuid();
    session.attachClient(token, response);
    
    var element = {
        _next:  null,
        session: session
    };
  
    if(this._length == 0) {
        this._head = element;
        this._tail = element;
    } else {
        this._tail._next = element;
        this._tail = element;
    }
  
    ++this._length;
    debug("Attached", sid, this._length);
    
    callback(token, element.session);
};

Manager.prototype.detachSession = function(sid) {
    var previous = current = this._head;
    
    while(current !== null) {
        if(current.session.sid === sid) {
            previous._next = current._next;
        
            if(current.session.sid === this._head.session.sid) {
                this._head = current._next;
            }
        
            if(current.session.sid === this._tail.session.sid) {
                this._tail = previous;
            }
        
            this._length--;
            debug("Detached", sid, this._length);
            break;
        } else {
            previous = current;
            current = current._next;
        }
    }
    
    if(current === null) {
        debug("Detach Failed", sid, this._length);
    }
    
    delete current, previous;
};

Manager.prototype.findSession = function(sid, callback) {
    var current = this._head;
  
    while(current && current.session.sid !== sid) {
        current = current._next;
    }
  
    if(current !== null && current.session.sid === sid && current.session) {
        callback(current.session);
    }
};

Manager.prototype.forEachSession = function(callback, thisArg) {
    var current = this._head;
    
    while(current !== null) {
        callback.call(thisArg, current.session);
        current = current._next;
    }
};
