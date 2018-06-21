/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the ResumeFactory class.
@license MIT. See LICENSE.md for details.
@module core/resume-factory
*/



const FS              = require('fs');
const HMS    = require('./status-codes');
const HME             = require('./event-codes');
const ResumeConverter = require('fresh-jrs-converter');
const resumeDetect    = require('../utils/resume-detector');
require('string.prototype.startswith');



/**
A simple factory class for FRESH and JSON Resumes.
@class ResumeFactory
*/

module.exports = {



  /**
  Load one or more resumes from disk.

  @param {Object} opts An options object with settings for the factory as well
  as passthrough settings for FRESHResume or JRSResume. Structure:

      {
        format: 'FRESH',    // Format to open as. ('FRESH', 'JRS', null)
        objectify: true,    // FRESH/JRSResume or raw JSON?
        inner: {            // Passthru options for FRESH/JRSResume
          sort: false
        }
      }

  */
  load( sources, opts, emitter ) {
    return sources.map( function(src) {
      return this.loadOne( src, opts, emitter );
    }
    , this);
  },


  /** Load a single resume from disk.  */
  loadOne( src, opts, emitter ) {

    let toFormat = opts.format;     // Can be null

    // Get the destination format. Can be 'fresh', 'jrs', or null/undefined.
    toFormat && (toFormat = toFormat.toLowerCase().trim());

    // Load and parse the resume JSON
    const info = _parse(src, opts, emitter);
    if (info.fluenterror) { return info; }

    // Determine the resume format: FRESH or JRS
    let { data } = info;
    const orgFormat = resumeDetect(data);
    if (orgFormat === 'unk') {
      info.fluenterror = HMS.unknownSchema;
      return info;
    }

    // Convert between formats if necessary
    if (toFormat && ( orgFormat !== toFormat )) {
      data = ResumeConverter[ `to${toFormat.toUpperCase()}` ](data);
    }

    // Objectify the resume, that is, convert it from JSON to a FRESHResume
    // or JRSResume object.
    let rez = null;
    if (opts.objectify) {
      const reqLib = `../core/${toFormat || orgFormat}-resume`;
      const ResumeClass = require(reqLib);
      rez = new ResumeClass().parseJSON( data, opts.inner );
      rez.i().file = src;
    }

    return {
      file: src,
      json: info.data,
      rez
    };
  }
};

var _parseJSON = function( rawData ) {
  let ret = JSON.parse( rawData );
  return ret.json;
};

var _parseYAML = function( rawData ) {
  const yaml = require('js-yaml');
  let ret = yaml.safeLoad(rawData);
  return ret;
};

const parsers = {
  'json': _parseJSON,
  'yml': _parseYAML,
  'yaml': _parseYAML,
};

var _parse = function( fileName, opts, eve ) {

  let rawData = null;
  try {

    // Read the file
    eve && eve.stat( HME.beforeRead, { file: fileName });
    rawData = FS.readFileSync( fileName, 'utf8' );
    eve && eve.stat( HME.afterRead, { file: fileName, data: rawData });
    let extension = fileName.split('.').pop();

    // Parse the file
    eve && eve.stat(HME.beforeParse, { data: rawData });
    let ret = parsers[extension](rawData);
    const orgFormat =
      ret.meta && ret.meta.format && ret.meta.format.startsWith('FRESH@')
      ? 'fresh' : 'jrs';

    eve && eve.stat(HME.afterParse, { file: fileName, data: ret, fmt: orgFormat });
    return { data: ret };
  } catch (err) {
    // Can be ENOENT, EACCES, SyntaxError, etc.
    return {
      fluenterror: rawData ? HMS.parseError : HMS.readError,
      inner: err,
      raw: rawData,
      file: fileName
    };
  }
};
