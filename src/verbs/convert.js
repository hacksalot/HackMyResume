/**
Implementation of the 'convert' verb for HackMyResume.
@module convert.js
@license MIT. See LICENSE.md for details.
*/

(function(){

  var ResumeFactory = require('../core/resume-factory');
  var chalk = require('chalk');

  /**
  Convert between FRESH and JRS formats.
  */
  module.exports = function convert( sources, dst, opts, logger ) {
    var _log = logger || console.log;
    if( !sources || !sources.length ) { throw { fluenterror: 6 }; }
    if( !dst || !dst.length ) {
      if( sources.length === 1 ) { throw { fluenterror: 5 }; }
      else if( sources.length === 2 ) { dst = [ sources[1] ]; sources = [ sources[0] ]; }
      else { throw { fluenterror: 5 }; }
    }
    if( sources && dst && sources.length && dst.length && sources.length !== dst.length ) {
      throw { fluenterror: 7 };
    }
    var sourceResumes = ResumeFactory.load( sources, { log: _log, format: null, objectify: true, throw: true } );
    sourceResumes.forEach(function( src, idx ) {
      var sheet = src.rez;
      var sourceFormat = ((sheet.basics && sheet.basics.imp) || sheet.imp).orgFormat === 'JRS' ? 'JRS' : 'FRESH';
      var targetFormat = sourceFormat === 'JRS' ? 'FRESH' : 'JRS';
      _log( chalk.green('Converting ') + chalk.green.bold(src.file) + chalk.green(' (' +
        sourceFormat + ') to ') + chalk.green.bold(dst[0]) +
        chalk.green(' (' + targetFormat + ').') );
      sheet.saveAs( dst[idx], targetFormat );
    });
  };

}());
