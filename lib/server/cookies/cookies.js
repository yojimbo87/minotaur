/*
Copyright (c) 2011 Jed Schmidt, http://jedschmidt.com/
 
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

var cache = {}

function Cookies( request, response, keys ) {
  this.request = request
  this.response = response
  this.keys = keys
}

Cookies.prototype = {
  get: function( name, opts ) {
    var sigName = name + ".sig"
      , header, match, value, remote, data, index
      
    header = this.request.headers[ "cookie" ]
    if ( !header ) return    

    match = header.match( getPattern( name ) )
    if ( !match ) return
    
    value = match[ 1 ]
    if ( !opts || !opts.signed ) return value

    remote = this.get( sigName )
    if ( !remote ) return
    
    data = name + "=" + value    
    index = this.keys.index( data, remote )

    if ( index < 0 ) this.set( sigName, null, { path: "/" } )
    
    else {
      index && this.set( sigName, this.keys.sign( data ) )
      return value
    }
  },
  
  set: function( name, value, opts ) {
    var res = this.response
      , headers = res.getHeader( "Set-Cookie" ) || []
      , secure = res.socket.encrypted
      , cookie = new Cookie( name, value, opts )
      , header
      
    if ( typeof headers == "string" ) headers = [ headers ]
      
    if ( !secure && opts && opts.secure ) throw "Cannot send secure cookie over unencrypted socket"
    
    cookie.secure = secure
    headers.push( cookie.toHeader() )
    
    if ( opts && opts.signed ) {
      cookie.value = this.keys.sign( cookie.toString() )
      cookie.name += ".sig"
      headers.push( cookie.toHeader() )
    }
    
    res.setHeader( "Set-Cookie", headers )
    return this
  }
}

function Cookie( name, value, attrs ) {
  value || ( this.expires = new Date( 0 ) )

  this.name = name
  this.value = value || ""

  for ( var name in attrs ) this[ name ] = attrs[ name ]
}

Cookie.prototype = {
  path: "/",
  expires: undefined,
  domain: undefined,
  httpOnly: true,
  secure: false,

  toString: function() { return this.name + "=" + this.value },
  
  toHeader: function() {
    var header = this.toString()
    
    if ( this.path      ) header += "; path=" + this.path
    if ( this.expires   ) header += "; expires=" + this.expires.toUTCString()
    if ( this.domain    ) header += "; domain=" + this.domain
    if ( this.secure    ) header += "; secure"
    if ( this.httpOnly  ) header += "; httponly"
    
    return header
  }
}

function getPattern( name ) {
  if ( cache[ name ] ) return cache[ name ]
  
  return cache[ name ] = new RegExp(
    "(?:^|;) *" +
    name.replace( /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&" ) +
    "=([^;]*)"
  )
}

module.exports = Cookies
