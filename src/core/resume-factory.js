/**
Definition of the ResumeFactory class.
@license MIT. See LICENSE.md for details.
@module resume-factory.js
*/



(function(){



  var FS          = require('fs'),
  HACKMYSTATUS    = require('./status-codes'),
  HME             = require('./event-codes'),
  ResumeConverter = require('fresh-jrs-converter'),
  chalk           = require('chalk'),
  SyntaxErrorEx   = require('../utils/syntax-error-ex'),
  _               = require('underscore');
                    require('string.prototype.startswith');



  /**
  A simple factory class for FRESH and JSON Resumes.
  @class ResumeFactory
  */
  var ResumeFactory = module.exports = {



    /**
    Load one or more resumes from disk.

    @param opts An options object with settings for the factory as well as
    passthrough settings for FRESHResume or JRSResume. Structure:

        {
          format: 'FRESH',    // Format to open as. ('FRESH', 'JRS', null)
          objectify: true,    // FRESH/JRSResume or raw JSON?
          inner: {            // Passthru options for FRESH/JRSResume
            sort: false
          }
        }

    */
    load: function ( sources, opts, emitter ) {

      return sources.map( function( src ) {
        return this.loadOne( src, opts, emitter );
      }, this);

    },



    /**
    Load a single resume from disk.
    */
    loadOne: function( src, opts, emitter ) {

      var toFormat = opts.format;     // Can be null
      var objectify = opts.objectify;

      // Get the destination format. Can be 'fresh', 'jrs', or null/undefined.
      toFormat && (toFormat = toFormat.toLowerCase().trim());

      // Load and parse the resume JSON
      var info = _parse( src, opts, emitter );
      if( info.fluenterror ) return info;

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
        rez = new ResumeClass().parseJSON( json, opts.inner );
        rez.i().file = src;
      }

      return {
        file: src,
        json: info.json,
        rez: rez
      };
    }
  };



  function _parse( fileName, opts, eve ) {

    var rawData;
    try {

      // Read the file
      eve && eve.stat( HME.beforeRead, { file: fileName });
      rawData = FS.readFileSync( fileName, 'utf8' );
      eve && eve.stat( HME.afterRead, { data: rawData });

      // Parse the file
      eve && eve.stat( HME.beforeParse, { data: rawData });
      var ret = { json: JSON.parse( rawData ) };
      eve && eve.stat( HME.afterParse, { data: ret.json } );

      return ret;
    }
    catch( e ) {
      // Can be ENOENT, EACCES, SyntaxError, etc.
      var ex = {
        fluenterror: rawData ? HACKMYSTATUS.parseError : HACKMYSTATUS.readError,
        inner: e, raw: rawData, file: fileName, shouldExit: false
      };
      eve && eve.err( ex.fluenterror, ex );
      if( opts.throw ) throw ex;
      return ex;
    }

  }



}());
