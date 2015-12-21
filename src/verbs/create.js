(function(){

  var FLUENT = require('../hackmyapi')
    , MKDIRP = require('mkdirp')
    , PATH = require('path');

  /**
  Create a new empty resume in either FRESH or JRS format.
  */
  module.exports = function create( src, dst, opts, logger ) {
    var _log = logger || console.log;
    if( !src || !src.length ) throw { fluenterror: 8 };
    src.forEach( function( t ) {
      var safeFormat = opts.format.toUpperCase();
      _log('Creating new '.useful +safeFormat.useful.bold +
        ' resume: '.useful + t.useful.bold);
      MKDIRP.sync( PATH.dirname( t ) ); // Ensure dest folder exists;
      FLUENT[ safeFormat + 'Resume' ].default().save( t );
    });
  };

}());
