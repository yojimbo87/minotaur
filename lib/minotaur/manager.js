var sys = require("sys"),
    con = require("./connection");

var debug;

/*-----------------------------------------------
  Connection Manager
-----------------------------------------------*/
module.exports = Manager;

function Manager(showDebug) {
    if(showDebug) {
        debug = function(){
            sys.log("\033[31mManager: " + 
            Array.prototype.join.call(arguments, ", ") + 
            "\033[39m"); 
        };
    } else {
        debug = function(){};
    }
  
    this._head = null;
    this._tail  = null;
    // number of connected clients
    this._length = 0;
    // counter for generating unique session IDs
    this._counter = 0;
};

Object.defineProperty(Manager.prototype, "length", {
    get: function() {
        return this._length;
    }
});

Manager.prototype.createID = function() {
    return process.pid + "" + (this._counter++);
};

// attachment of new connected client
Manager.prototype.attach = function(id, res) { 
    var client = {
        _next:  null,
        connection: new con(id, res)
    };
  
    if(this._length == 0) {
        this._head = client;
        this._tail = client;
    } else {
        this._tail._next = client;
        this._tail = client;
    }
  
    ++this._length;
    debug("Attached", id, this._length);
};

// detachment of timedout client
Manager.prototype.detach = function(id) {
    var previous = current = this._head;
    
    while(current !== null) {
        if(current.connection.id === id) {
            previous._next = current._next;
        
            if(current.connection.id === this._head.connection.id) {
                this._head = current._next;
            }
        
            if(current.connection.id === this._tail.connection.id) {
                this._tail = previous;
            }
        
            this._length--;
            debug("Detached", id, this._length);
            break;
        } else {
            previous = current;
            current = current._next;
        }
    }
    
    if(current === null) {
        debug("Detach Failed", id, this._length);
    }
    
    delete current, previous;
};

// search for certain connected client with callback
Manager.prototype.find = function(id, callback) {
    var current = this._head;
  
    while(current && current.connection.id !== id) {
        current = current._next;
    }
  
    if(current !== null && current.connection.id === id && current.connection) {
        callback(current.connection);
    }
};

// loop through all connected client with callback
Manager.prototype.forEach = function(callback, thisArg) {
    var current = this._head;
    
    while(current !== null) {
        callback.call(thisArg, current.connection);
        current = current._next;
    }
};