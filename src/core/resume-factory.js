/**
Definition of the ResumeFactory class.
@license MIT. See LICENSE.md for details.
@module resume-factory.js
*/



(function(){



  require('string.prototype.startswith');
  var FS = require('fs');
  var ResumeConverter = require('./convert');
  var chalk = require('chalk');
  var SyntaxErrorEx = require('../utils/syntax-error-ex');



  /**
  A simple factory class for FRESH and JSON Resumes.
  @class ResumeFactory
  */
  var ResumeFactory = module.exports = {



    /**
    Load one or more resumes from disk.
    */
    load: function ( sources, opts ) {

      // Loop over all inputs, parsing each to JSON and then to a FRESHResume
      // or JRSResume object.
      var that = this;
      return sources.map( function( src ) {
        return that.loadOne( src, opts );
      });

    },



    /**
    Load a single resume from disk.
    */
    loadOne: function( src, opts ) {

      var log = opts.log;
      var toFormat = opts.format;
      var objectify = opts.objectify;

      // Get the destination format. Can be 'fresh', 'jrs', or null/undefined.
      toFormat && (toFormat = toFormat.toLowerCase().trim());

      // Load and parse the resume JSON
      var info = _parse( src, opts );
      if( info.error ) return info;

      // Determine the resume format: FRESH or JRS
      var json = info.json;
      var orgFormat = ( json.meta && json.meta.format &&
                        json.meta.format.startsWith('FRESH@') ) ?
                        'fresh' : 'jrs';

      // Convert between formats if necessary
      if( toFormat && (orgFormat !== toFormat) ) {
        json = ResumeConverter[ 'to' + toFormat.toUpperCase() ]( json );
      }

      // Objectify the resume, that is, convert it from JSON to a FRESHResume
      // or JRSResume object.
      var rez;
      if( objectify ) {
        var ResumeClass = require('../core/' + (toFormat || orgFormat) + '-resume');
        rez = new ResumeClass().parseJSON( json );
        rez.i().file = src;
      }

      return {
        file: src,
        json: info.json,
        rez: rez
      };
    }
  };



  function _parse( fileName, opts ) {
    var rawData;
    try {

      // TODO: Core should not log
      opts.log( chalk.cyan('Reading resume: ') + chalk.cyan.bold(fileName) );

      // Read the file
      rawData = FS.readFileSync( fileName, 'utf8' );

      // Parse it to JSON
      return {
        json: JSON.parse( rawData )
      };

    }
    catch( ex ) {

      // JSON.parse failed due to invalid JSON
      if ( !opts.muffle && ex instanceof SyntaxError) {
        var info = new SyntaxErrorEx( ex, rawData );
        opts.log( chalk.red.bold(fileName.toUpperCase() + ' contains invalid JSON on line ' +
          info.line + ' column ' + info.col + '.' +
          chalk.red(' Unable to validate.')));
        opts.log( chalk.red.bold('INTERNAL: ' + ex) );
        ex.handled = true;
      }

      if( opts.throw ) throw ex;
      else return {
        error: ex,
        raw: rawData,
        file: fileName
      };

    }
  }



}());
