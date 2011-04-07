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

crypto = require( "crypto" )
path = require( "path" )
fs = require( "fs" )

keysPath = path.join( __dirname, "defaultKeys.json" )

defaults = path.existsSync( keysPath )
  ? JSON.parse( fs.readFileSync( keysPath ) )
  : undefined

function Keygrip( keys ) {
  if ( !( this instanceof Keygrip ) ) return new Keygrip( keys )
  
  if ( !keys || !( 0 in keys ) ) {
    if ( keys = defaults ) console.warn( "No keys specified, using defaults instead." )
    
    else throw "Keys must be provided or default keys must exist."
  }
  
  function sign( data, key ) {
    return crypto
      .createHmac( "sha1", key )
      .update( data ).digest( "base64" )
      .replace( /\/|\+|=/g, function( x ) {
        return ({ "/": "_", "+": "-", "=": "" })[ x ]  
      })
  }

  this.sign = function( data ){ return sign( data, keys[ 0 ] ) }

  this.verify = function( data, digest ) {
    return this.index( data, digest ) > -1
  }

  this.index = function( data, digest ) {
    for ( var i = 0, l = keys.length; i < l; i++ ) {
      if ( digest === sign( data, keys[ i ] ) ) return i
    }
    
    return -1
  }
}

Keygrip.sign = Keygrip.verify = Keygrip.index = function() {
  throw "Usage: require( 'keygrip' )( <array-of-keys> )"
}

module.exports = Keygrip