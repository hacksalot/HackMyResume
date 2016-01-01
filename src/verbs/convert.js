/**
Implementation of the 'convert' verb for HackMyResume.
@module convert.js
@license MIT. See LICENSE.md for details.
*/

(function(){

  var ResumeFactory = require('../core/resume-factory');

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
    var sourceResumes = ResumeFactory.load( sources, _log, null, true );
    sourceResumes.forEach(function( src, idx ) {
      var sheet = src.rez;
      var sourceFormat = ((sheet.basics && sheet.basics.imp) || sheet.imp).orgFormat === 'JRS' ? 'JRS' : 'FRESH';
      var targetFormat = sourceFormat === 'JRS' ? 'FRESH' : 'JRS';
      _log( 'Converting '.useful + src.file.useful.bold + (' (' +
        sourceFormat + ') to ').useful + dst[0].useful.bold +
        (' (' + targetFormat + ').').useful );
      sheet.saveAs( dst[idx], targetFormat );
    });
  };

}());
