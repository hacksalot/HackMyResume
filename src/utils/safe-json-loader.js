/**
Definition of the SafeJsonLoader class.
@module syntax-error-ex.js
@license MIT. See LICENSE.md for details.
*/



(function() {



  var FS = require('fs')
    , HMSTATUS = require('../core/status-codes')
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
      ret.ex = ( ret.raw && ret.raw.trim() ) ?
        { // JSON.parse failed, likely because of a SyntaxError
          fluenterror: HMSTATUS.parseError,
          inner: SyntaxErrorEx.is( ex ) ? new SyntaxErrorEx( ex ) : ex
        } :
        { // FS.readFileSync failed, likely because of ENOENT or EACCES
          fluenterror: HMSTATUS.readError,
          inner: ex
        };

    }

    return ret;

  };


}());
