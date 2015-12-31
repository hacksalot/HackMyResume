/**
Core resume-loading logic for HackMyResume.
@module resume-factory.js
*/

(function(){

  require('string.prototype.startswith');
  var FS = require('fs');
  var ResumeConverter = require('./convert');

  /**
  A simple factory class for FRESH and JSON Resumes.
  @class ResumeFactory
  */
  module.exports = {

    /**
    Load one or more resumes in a specific source format.
    */
    load: function ( src, log, fn, toFormat ) {

      toFormat = toFormat && (toFormat.toLowerCase().trim()) || 'fresh';
      var ResumeClass = require('../core/' + toFormat + '-resume');

      return src.map( function( res ) {
        var rezJson = JSON.parse( FS.readFileSync( res ) );
        var orgFormat = ( rezJson.meta && rezJson.meta.format &&
                          rezJson.meta.format.startsWith('FRESH@') ) ?
                          'fresh' : 'jrs';
        if(orgFormat !== toFormat) {
          rezJson = ResumeConverter[ 'to' + toFormat.toUpperCase() ]( rezJson );
        }
        // TODO: Core should not log
        log( 'Reading '.info + orgFormat.toUpperCase().infoBold + ' resume: '.info + res.cyan.bold );
        return (fn && fn(res)) || (new ResumeClass()).parseJSON( rezJson );
      });

    }

  };

}());
