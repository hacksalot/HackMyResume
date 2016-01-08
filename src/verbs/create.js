/**
Implementation of the 'create' verb for HackMyResume.
@module create.js
@license MIT. See LICENSE.md for details.
*/

(function(){

  var MKDIRP = require('mkdirp')
    , PATH = require('path')
    , chalk = require('chalk')
    , HACKMYSTATUS = require('../core/status-codes');

  /**
  Create a new empty resume in either FRESH or JRS format.
  */
  module.exports = function create( src, dst, opts, logger ) {
    var _log = logger || console.log;
    if( !src || !src.length ) throw { fluenterror: HACKMYSTATUS.createNameMissing };
    src.forEach( function( t ) {
      var safeFormat = opts.format.toUpperCase();
      _log(chalk.green('Creating new ') + chalk.green.bold(safeFormat) +
        chalk.green(' resume: ') + chalk.green.bold(t));
      MKDIRP.sync( PATH.dirname( t ) ); // Ensure dest folder exists;
      var RezClass = require('../core/' + safeFormat.toLowerCase() + '-resume' );
      RezClass.default().save(t);
      //FLUENT[ safeFormat + 'Resume' ].default().save( t );
    });
  };

}());
