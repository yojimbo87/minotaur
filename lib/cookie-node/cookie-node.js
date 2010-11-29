/*
cookie-node.js

-----------------
cookie-node is a cookie module for [node.js](http://nodejs.org/), based
loosely on Tornado's approach to [signed cookies]
(http://www.tornadoweb.org/documentation#cookies-and-secure-cookies).
-----------------

Copyright (c) 2010 Jed Schmidt, http://jedschmidt.com/
 
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
 
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var crypto = require('crypto');
var Buffer = require('buffer').Buffer;

function hex_hmac_sha1(data, key) {
  var hmac = crypto.createHmac('sha1', key);
  hmac.update(data);
  return hmac.digest('hex');
}

var base64 = {
    encode: function(str) {
        return (new Buffer(str)).toString('base64');
    },
    decode: function(str) {
        return (new Buffer(str, 'base64')).toString('utf8');
    }
}

processCookie = exports.processCookie = function(name, value) {
  var len, parts, expires, remoteSig, localSig;

  parts = value.replace(/\*/g, '=').split("|");

  if ( parts.length !== 4 ) {
    return null;
  }

  len = parts[0];
  value = base64.decode( parts[1] ).substr(0, len);
  expires = new Date( +parts[2] );
  remoteSig = parts[3];

  if ( expires < new Date ) {
    return null;
  }

  localSig = hex_hmac_sha1( parts.slice( 0, 3 ).join("|"), cookieSecret() );

  if ( localSig !== remoteSig ) {
    throw new Error("invalid cookie signature: " + name);
  }

  return value;
};


var mutateHttp = function(http){
  http.IncomingMessage.prototype._parseCookies = function() {
    var header = this.headers["cookie"] || "",
        ret = {};

    header.split(";").forEach( function( cookie ) {
      var parts = cookie.split("="),
          name =  (parts[0] ? parts[0].trim() : ''),
          value = (parts[1] ? parts[1].trim() : '');
    
      ret[ name ] = value;
    });
    return this.cookies = ret;
  };


  http.IncomingMessage.prototype.getCookie = function( name ) {
    var cookies = this.cookies || this._parseCookies();
    return cookies[ name ] || null;
  };

  http.IncomingMessage.prototype.getSecureCookie = function( name ) {
    var value = this.getCookie( name );

    if ( !value ) {
      return null;
    }

    return processCookie(name, value);
  };

  // this probably isn't kosher, but it's the best way to keep the interface sane.
  var _writeHead = http.ServerResponse.prototype.writeHead;
  var COOKIE_KEY = 'Set-Cookie', slice = Array.prototype.slice;
  http.ServerResponse.prototype.writeHead = function () {
    // Honor the passed args and method signature (see http.writeHead docs)
    var args = slice.call(arguments), headers = args[args.length-1];
    if (!headers || typeof(headers) != 'object') {
      // No header arg - create and append to args list
      args.push(headers = []);
    }
  
    // Merge cookie values
    var prev = headers[COOKIE_KEY], cookies = this.cookies || [];
    if (prev) cookies.push(prev);
    if (cookies.length > 0) headers[COOKIE_KEY] = cookies.join(", ");
  
    // Invoke original writeHead()
    _writeHead.apply(this, args);
  };
  
  http.ServerResponse.prototype.setCookie = function( name, value, options ) {
    var cookies = this.cookies || ( this.cookies = [] ),
        cookie = [ name, "=", value, ";" ];
    
    options = options || {};
    
    if ( options.expires )
      cookie.push( " expires=", (new Date(options.expires)).toUTCString(), ";" );
    
    if ( options.path )
      cookie.push( " path=", options.path, ";" );
    
    if ( options.domain )
      cookie.push( " domain=", options.domain, ";" );
    
    if ( options.secure )
      cookie.push( " secure", ";" );
    
    if ( options.httpOnly )
      cookie.push( " httponly" );
    
    cookies.push( cookie.join("") );
  };
  
  http.ServerResponse.prototype.generateCookieValue = function( value, options ) {
    options = options || {};
    value = [ (value + '').length, base64.encode( value ), +options.expires ];
    var signature = hex_hmac_sha1( value.join("|"), cookieSecret() );
    
    value.push( signature );
    value = value.join("|").replace(/=/g, '*');
    
    return value;
  };
  
  http.ServerResponse.prototype.setSecureCookie = function( name, value, options ) {
    options = options || {};
    if (value !== null && typeof value !== 'undefined') value = value.toString();
    else value = '';
    value = this.generateCookieValue(value, options);
    this.setCookie( name, value, options );
  };
  
  http.ServerResponse.prototype.clearCookie = function( name, options ) {
    options = options || {};
    options.expires = new Date( +new Date - 30 * 24 * 60 * 60 * 1000 );
    this.setCookie( name, "", options );
  };
};

mutateHttp(require('http'));


function cookieSecret() {
  if ( exports.secret )
    return exports.secret;

  return exports.secret = hex_hmac_sha1( Math.random(), Math.random() );
}
