(function(){

  var ResumeFactory = require('../core/resume-factory');

  /**
  Convert between FRESH and JRS formats.
  */
  module.exports = function convert( src, dst, opts, logger ) {
    var _log = logger || console.log;
    if( !src || !src.length ) { throw { fluenterror: 6 }; }
    if( !dst || !dst.length ) {
      if( src.length === 1 ) { throw { fluenterror: 5 }; }
      else if( src.length === 2 ) { dst = [ src[1] ]; src = [ src[0] ]; }
      else { throw { fluenterror: 5 }; }
    }
    if( src && dst && src.length && dst.length && src.length !== dst.length ) {
      throw { fluenterror: 7 };
    }
    var sheets = ResumeFactory.load( src, _log );
    sheets.forEach(function(sheet, idx){
      var sourceFormat = sheet.imp.orgFormat === 'JRS' ? 'JRS' : 'FRESH';
      var targetFormat = sourceFormat === 'JRS' ? 'FRESH' : 'JRS';
      _log( 'Converting '.useful + sheet.imp.fileName.useful.bold + (' (' +
        sourceFormat + ') to ').useful + dst[0].useful.bold +
        (' (' + targetFormat + ').').useful );
      sheet.saveAs( dst[idx], targetFormat );
    });
  };

}());
