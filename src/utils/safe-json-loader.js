/**
Definition of the SafeJsonLoader class.
@module syntax-error-ex.js
@license MIT. See LICENSE.md for details.
*/



(function() {



  var FS = require('fs')
    , SyntaxErrorEx = require('./syntax-error-ex');



  module.exports = function loadSafeJson( file ) {

    var ret = { };
    try {

      ret.raw = FS.readFileSync( file, 'utf8' );
      ret.json = JSON.parse( ret.raw );

    }
    catch( ex ) {

      // If we get here, either FS.readFileSync or JSON.parse failed.
      // We'll return HMSTATUS.readError or HMSTATUS.parseError.
      var retRaw = ret.raw && ret.raw.trim();

      ret.ex = {
        operation: retRaw ? 'parse' : 'read',
        inner: SyntaxErrorEx.is( ex ) ? (new SyntaxErrorEx( ex, retRaw )) : ex,
        file: file
      };

    }

    return ret;

  };


}());
