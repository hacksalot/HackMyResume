###*
Definition of the ResumeFactory class.
@license MIT. See LICENSE.md for details.
@module core/resume-factory
###



FS              = require('fs')
HACKMYSTATUS    = require('./status-codes')
HME             = require('./event-codes')
ResumeConverter = require('fresh-jrs-converter')
chalk           = require('chalk')
SyntaxErrorEx   = require('../utils/syntax-error-ex')
_               = require('underscore')
require('string.prototype.startswith')



###*
A simple factory class for FRESH and JSON Resumes.
@class ResumeFactory
###

ResumeFactory = module.exports =



  ###*
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

  ###
  load: ( sources, opts, emitter ) ->
    sources.map( (src) ->
      @loadOne( src, opts, emitter )
    , @)


  ###* Load a single resume from disk.  ###
  loadOne: ( src, opts, emitter ) ->

    toFormat = opts.format     # Can be null
    objectify = opts.objectify

    # Get the destination format. Can be 'fresh', 'jrs', or null/undefined.
    toFormat && (toFormat = toFormat.toLowerCase().trim())

    # Load and parse the resume JSON
    info = _parse src, opts, emitter
    return info if info.fluenterror

    # Determine the resume format: FRESH or JRS
    json = info.json
    isFRESH = json.meta && json.meta.format && json.meta.format.startsWith('FRESH@');
    orgFormat = if isFRESH then 'fresh' else 'jrs'

    # Convert between formats if necessary
    if toFormat and ( orgFormat != toFormat )
      json = ResumeConverter[ 'to' + toFormat.toUpperCase() ]( json )

    # Objectify the resume, that is, convert it from JSON to a FRESHResume
    # or JRSResume object.
    rez = null
    if objectify
      ResumeClass = require('../core/' + (toFormat || orgFormat) + '-resume');
      rez = new ResumeClass().parseJSON( json, opts.inner );
      rez.i().file = src;

    file: src
    json: info.json
    rez: rez


_parse = ( fileName, opts, eve ) ->

  rawData = null
  try

    # Read the file
    eve && eve.stat( HME.beforeRead, { file: fileName });
    rawData = FS.readFileSync( fileName, 'utf8' );
    eve && eve.stat( HME.afterRead, { file: fileName, data: rawData });

    # Parse the file
    eve && eve.stat HME.beforeParse, { data: rawData }
    ret = { json: JSON.parse( rawData ) }
    orgFormat =
      if ret.json.meta && ret.json.meta.format && ret.json.meta.format.startsWith('FRESH@')
      then 'fresh' else 'jrs'

    eve && eve.stat HME.afterParse, { file: fileName, data: ret.json, fmt: orgFormat }
    return ret
  catch
    # Can be ENOENT, EACCES, SyntaxError, etc.
    fluenterror: if rawData then HACKMYSTATUS.parseError else HACKMYSTATUS.readError
    inner: _error
    raw: rawData
    file: fileName
