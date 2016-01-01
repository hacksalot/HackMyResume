/**
Implementation of the 'convert' verb for HackMyResume.
@module convert.js
@license MIT. See LICENSE.md for details.
*/



(function(){



  var ResumeFactory = require('../core/resume-factory')
    , chalk = require('chalk');



  /**
  Convert between FRESH and JRS formats.
  */
  module.exports = function convert( sources, dst, opts, logger ) {

    // Housekeeping
    var _log = logger || console.log;
    if( !sources || !sources.length ) { throw { fluenterror: 6 }; }
    if( !dst || !dst.length ) {
      if( sources.length === 1 ) { throw { fluenterror: 5 }; }
      else if( sources.length === 2 ) {
        dst = [ sources[1] ]; sources = [ sources[0] ];
      }
      else { throw { fluenterror: 5 }; }
    }
    if( sources && dst && sources.length && dst.length &&
        sources.length !== dst.length ) { throw { fluenterror: 7 }; }

    // Load source resumes
    var sourceResumes = ResumeFactory.load( sources, {
      log: _log, format: null, objectify: true, throw: true
    });

    // Apply the conversion to each
    sourceResumes.forEach(function( src, idx ) {

      var s = src.rez
        , srcFmt = ((s.basics && s.basics.imp) || s.imp).orgFormat === 'JRS' ?
        'JRS' : 'FRESH';

      var targetFormat = srcFmt === 'JRS' ? 'FRESH' : 'JRS';

      // TODO: Core should not log
      _log( chalk.green('Converting ') + chalk.green.bold(src.file) +
        chalk.green(' (' + sourceFormat + ') to ') + chalk.green.bold(dst[0]) +
        chalk.green(' (' + targetFormat + ').'));

      s.saveAs( dst[idx], targetFormat );
    });
  };



}());
