/**
Implementation of the 'convert' verb for HackMyResume.
@module convert.js
@license MIT. See LICENSE.md for details.
*/



(function(){



  var ResumeFactory = require('../core/resume-factory')
    , chalk = require('chalk')
    , Verb = require('../core/verb')    
    , HACKMYSTATUS = require('../core/status-codes');


  var ConvertVerb = module.exports = Verb.extend({

    invoke: function() {
      convert.apply( this, arguments );
    }

  });



  /**
  Convert between FRESH and JRS formats.
  */
  function convert( srcs, dst, opts, logger ) {

    // Housekeeping
    var _log = logger || console.log;
    if( !srcs || !srcs.length ) { throw { fluenterror: 6 }; }
    if( !dst || !dst.length ) {
      if( srcs.length === 1 ) {
        throw { fluenterror: HACKMYSTATUS.inputOutputParity };
      }
      else if( srcs.length === 2 ) {
        dst = dst || []; dst.push( srcs.pop() );
      }
      else {
        throw { fluenterror: HACKMYSTATUS.inputOutputParity };
      }
    }
    if(srcs && dst && srcs.length && dst.length && srcs.length !== dst.length){
      throw { fluenterror: HACKMYSTATUS.inputOutputParity };
    }

    // Load source resumes
    srcs.forEach( function( src, idx ) {

      // Load the resume
      var rinfo = ResumeFactory.loadOne( src, {
        log: _log, format: null, objectify: true, throw: true
      });

      var s = rinfo.rez
        , srcFmt = ((s.basics && s.basics.imp) || s.imp).orgFormat === 'JRS' ?
          'JRS' : 'FRESH'
        , targetFormat = srcFmt === 'JRS' ? 'FRESH' : 'JRS';

      // TODO: Core should not log
      _log( chalk.green('Converting ') + chalk.green.bold(rinfo.file) +
        chalk.green(' (' + srcFmt + ') to ') + chalk.green.bold(dst[idx]) +
        chalk.green(' (' + targetFormat + ').'));

      // Save it to the destination format
      s.saveAs( dst[idx], targetFormat );

    });

  }



}());
