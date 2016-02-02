###*
Implementation of the 'validate' verb for HackMyResume.
@module verbs/validate
@license MIT. See LICENSE.md for details.
###



FS = require 'fs'
ResumeFactory = require '../core/resume-factory'
SyntaxErrorEx = require '../utils/syntax-error-ex'
chalk = require 'chalk'
Verb = require '../verbs/verb'
HMSTATUS = require '../core/status-codes'
HMEVENT = require '../core/event-codes'
_ = require 'underscore'
safeLoadJSON = require '../utils/safe-json-loader'



###* An invokable resume validation command. ###
ValidateVerb = module.exports = Verb.extend

  init: -> @_super 'validate', _validate



###* Validate 1 to N resumes in FRESH or JSON Resume format. ###
_validate = (sources, unused, opts)  ->

  if !sources || !sources.length
    @err HMSTATUS.resumeNotFoundAlt, { quit: true }
    return null

  validator = require 'is-my-json-valid'
  schemas =
    fresh: require 'fresca'
    jars: require '../core/resume.json'

  # Validate input resumes. Return a { file: <f>, isValid: <v>} object for
  # each resume  valid, invalid, or broken.
  results = _.map sources, (t)  ->
    return { } if @hasError() and opts.assert
    r = _validateOne.call @, t, validator, schemas
    if r.fluenterror
      console.log r
      r.quit = opts.assert
      @err r.fluenterror, r
    r
  , @

  if @hasError() and !opts.assert
    @reject @errorCode
  else if !@hasError()
    @resolve results
  results


_validateOne = (t, validator, schemas) ->

  ret = file: t, isValid: false

  # Load the input file JSON 1st
  obj = safeLoadJSON t
  if obj.ex
    # safeLoadJSON can only return a READ error or a PARSE error
    errCode = if obj.ex.operation == 'parse' then HMSTATUS.parseError else HMSTATUS.readError
    if errCode == HMSTATUS.readError
      obj.ex.quiet = true
    return fluenterror: errCode, inner: obj.ex

  # Successfully read the resume. Now parse it as JSON.
  json = obj.json
  fmt = if json.basics then 'jrs' else 'fresh'
  errors = []

  try
    validate = validator schemas[ fmt ], { # Note [1]
      formats: { date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/ }
    };
    ret.isValid = validate json
    if !ret.isValid
      errors = validate.errors
  catch
    ret.ex = _error

  @stat HMEVENT.afterValidate,
    file: t
    isValid: ret.isValid
    fmt: fmt?.replace 'jars', 'JSON Resume'
    errors: errors

  if opts.assert and !ret.isValid
    return fluenterror: HMSTATUS.invalid, errors: errors

  ret
