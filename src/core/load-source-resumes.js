(function(){

  var FRESHResume = require('../core/fresh-resume');

  module.exports = function loadSourceResumes( src, log, fn ) {
    return src.map( function( res ) {
      log( 'Reading '.info + 'SOURCE'.infoBold + ' resume: '.info +
        res.cyan.bold );
      return (fn && fn(res)) || (new FRESHResume()).open( res );
    });
  };

}());
