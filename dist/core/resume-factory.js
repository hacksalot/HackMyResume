(function() {
  /**
  Definition of the ResumeFactory class.
  @license MIT. See LICENSE.md for details.
  @module core/resume-factory
  */
  /**
  A simple factory class for FRESH and JSON Resumes.
  @class ResumeFactory
  */
  var FS, HME, HMS, ResumeConverter, ResumeFactory, SyntaxErrorEx, _, _parse, chalk, resumeDetect;

  FS = require('fs');

  HMS = require('./status-codes');

  HME = require('./event-codes');

  ResumeConverter = require('fresh-jrs-converter');

  chalk = require('chalk');

  SyntaxErrorEx = require('../utils/syntax-error-ex');

  _ = require('underscore');

  resumeDetect = require('../utils/resume-detector');

  require('string.prototype.startswith');

  ResumeFactory = module.exports = {
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
    load: function(sources, opts, emitter) {
      return sources.map(function(src) {
        return this.loadOne(src, opts, emitter);
      }, this);
    },
    /** Load a single resume from disk.  */
    loadOne: function(src, opts, emitter) {
      var ResumeClass, info, json, orgFormat, reqLib, rez, toFormat;
      toFormat = opts.format; // Can be null
      
      // Get the destination format. Can be 'fresh', 'jrs', or null/undefined.
      toFormat && (toFormat = toFormat.toLowerCase().trim());
      // Load and parse the resume JSON
      info = _parse(src, opts, emitter);
      if (info.fluenterror) {
        return info;
      }
      // Determine the resume format: FRESH or JRS
      json = info.json;
      orgFormat = resumeDetect(json);
      if (orgFormat === 'unk') {
        info.fluenterror = HMS.unknownSchema;
        return info;
      }
      // Convert between formats if necessary
      if (toFormat && (orgFormat !== toFormat)) {
        json = ResumeConverter['to' + toFormat.toUpperCase()](json);
      }
      // Objectify the resume, that is, convert it from JSON to a FRESHResume
      // or JRSResume object.
      rez = null;
      if (opts.objectify) {
        reqLib = '../core/' + (toFormat || orgFormat) + '-resume';
        ResumeClass = require(reqLib);
        rez = new ResumeClass().parseJSON(json, opts.inner);
        rez.i().file = src;
      }
      return {
        file: src,
        json: info.json,
        rez: rez
      };
    }
  };

  _parse = function(fileName, opts, eve) {
    var err, orgFormat, rawData, ret;
    rawData = null;
    try {
      // Read the file
      eve && eve.stat(HME.beforeRead, {
        file: fileName
      });
      rawData = FS.readFileSync(fileName, 'utf8');
      eve && eve.stat(HME.afterRead, {
        file: fileName,
        data: rawData
      });
      eve && eve.stat(HME.beforeParse, {
        data: rawData
      });
      ret = {
        json: JSON.parse(rawData)
      };
      orgFormat = ret.json.meta && ret.json.meta.format && ret.json.meta.format.startsWith('FRESH@') ? 'fresh' : 'jrs';
      eve && eve.stat(HME.afterParse, {
        file: fileName,
        data: ret.json,
        fmt: orgFormat
      });
      return ret;
    } catch (error) {
      err = error;
      return {
        // Can be ENOENT, EACCES, SyntaxError, etc.
        fluenterror: rawData ? HMS.parseError : HMS.readError,
        inner: err,
        raw: rawData,
        file: fileName
      };
    }
  };

}).call(this);

//# sourceMappingURL=resume-factory.js.map
