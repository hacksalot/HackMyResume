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
module.exports = class ValidateVerb extends Verb



  constructor: -> super 'validate', _validate



# Validate 1 to N resumes in FRESH or JSON Resume format.
_validate = (sources, unused, opts)  ->

  if !sources || !sources.length
    @err HMSTATUS.resumeNotFoundAlt, quit: true
    return null

  validator = require 'is-my-json-valid'
  schemas =
    fresh: require 'fresca'
    jars: require '../core/resume.json'

  results = _.map sources, (t)  ->
    r = _validateOne.call @, t, validator, schemas, opts
    @err r.error.fluenterror, r.error if r.error
    r
  , @

  if @hasError() and !opts.assert
    @reject @errorCode
  else if !@hasError()
    @resolve results
  results


###*
Validate a single resume.
@returns {
  file: <fileName>,
  isValid: <validFlag>,
  status: <validationStatus>,
  violations: <validationErrors>,
  schema: <schemaType>,
  error: <errorObject>
}
###
_validateOne = (t, validator, schemas, opts) ->

  ret = file: t, isValid: false, status: 'unknown', schema: '-----'

  try

    # Read and parse the resume JSON. Won't throw.
    obj = safeLoadJSON t

    # If success, validate the resume against the schema
    if !obj.ex
      if obj.json.basics then ret.schema = 'jars' else ret.schema = 'fresh'
      validate = validator schemas[ ret.schema ], # Note [1]
        formats: { date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/ }
      ret.isValid = validate obj.json
      ret.status = if ret.isValid then 'valid' else 'invalid'
      ret.violations = validate.errors if !ret.isValid

    # If failure, package JSON read/parse errors
    else
      if obj.ex.operation == 'parse'
        errCode = HMSTATUS.parseError
        ret.status = 'broken'
      else
        errCode = HMSTATUS.readError
        ret.status = 'missing'
      ret.error =
        fluenterror: errCode,
        inner: obj.ex.inner,
        quiet: errCode == HMSTATUS.readError

  catch
    # Package any unexpected exceptions
    ret.error = fluenterror: HMSTATUS.validateError, inner: _error

  @stat HMEVENT.afterValidate, ret
  ret
