/**
Safe spawn utility for HackMyResume / FluentCV.
@module safe-spawn.js
@license MIT. See LICENSE.md for details.
*/



(function() {



  module.exports = function( cmd, args, isSync ) {

    try {

      var spawn = require('child_process')[ isSync? 'spawnSync' : 'spawn'];
      var info = spawn( cmd, args );

      if( !isSync ) {
        info.on('error', function(err) {
          throw {
            cmd: 'wkhtmltopdf',
            inner: err
          };
        });
      }
      else {
        if( info.error ) {
          throw {
            cmd: 'wkhtmltopdf',
            inner: info.error
          };
        }
      }
      
    }
    catch( ex ) {

    }
  };



}());
