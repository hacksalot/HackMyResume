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



  /**
  A simple factory class for FRESH and JSON Resumes.
  @class ResumeFactory
  */
  var ResumeFactory = module.exports = {



    /**
    Load one or more resumes from disk.
    */
    load: function ( sources, log, toFormat, objectify ) {
      // Loop over all inputs, parsing each to JSON and then to a FRESHResume
      // or JRSResume object.
      var that = this;
      return sources.map( function( src ) {
        return that.loadOne( src, log, toFormat, objectify );
      });

    },



    /**
    Load a single resume from disk.
    */
    loadOne: function( src, log, toFormat, objectify ) {

      // Get the destination format. Can be 'fresh', 'jrs', or null/undefined.
      toFormat && (toFormat = toFormat.toLowerCase().trim());

      // Load and parse the resume JSON
      var info = _parse( src, log, toFormat );
      if( info.error ) return info;
      var json = info.json;

      // Determine the resume format: FRESH or JRS
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
      }

      return {
        file: src,
        json: info.json,
        rez: rez
      };
    }
  };



  function _parse( fileName, log, toFormat ) {
    var rawData;
    try {

      // TODO: Core should not log
      log( chalk.gray('Reading resume: ') + chalk.cyan.bold(fileName) );

      rawData = FS.readFileSync( fileName, 'utf8' );
      return {
        json: JSON.parse( rawData )
      };

    }
    catch(ex) {
      return {
        error: ex,
        raw: rawData
      };
    }
  }



}());
