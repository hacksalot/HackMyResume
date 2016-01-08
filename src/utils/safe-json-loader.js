/**
Definition of the SafeJsonLoader class.
@module syntax-error-ex.js
@license MIT. See LICENSE.md for details.
*/



(function() {

  var FS = require('fs');

  module.exports = function loadSafeJson( file ) {
    try {
      return JSON.parse( FS.readFileSync( file ) );
    }
    catch(ex) {
      loadSafeJson.error = ex;
    }
    return null;
  };


}());
