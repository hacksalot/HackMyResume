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

  init: -> @_super 'validate'

  invoke: ->
    @stat HMEVENT.begin, { cmd: 'validate' }
    ret = validate.apply @, arguments
    @stat HMEVENT.end
    return ret



###* Validate 1 to N resumes in FRESH or JSON Resume format. ###
validate = (sources, unused, opts)  ->

  if !sources || !sources.length
    throw { fluenterror: HMSTATUS.resumeNotFoundAlt, quit: true }

  validator = require 'is-my-json-valid'
  schemas =
    fresh: require 'fresca'
    jars: require '../core/resume.json'

  # Validate input resumes. Return a { file: <f>, isValid: <v>} object for
  # each resume  valid, invalid, or broken.
  _.map sources, (t)  ->

    ret = file: t, isValid: false

    # Load the input file JSON 1st
    obj = safeLoadJSON t

    if !obj.ex

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

    # safeLoadJSON can only return a READ error or a PARSE error
    else
      errCode = if obj.ex.operation == 'parse' then HMSTATUS.parseError else HMSTATUS.readError
      if errCode == HMSTATUS.readError
        obj.ex.quiet = true
      @setError errCode, obj.ex
      @err errCode, obj.ex

    @stat HMEVENT.afterValidate,
      file: t
      isValid: ret.isValid
      fmt: fmt?.replace 'jars', 'JSON Resume'
      errors: errors

    if opts.assert and !ret.isValid
      throw fluenterror: HMSTATUS.invalid, shouldExit: true

    console.log '1111'

    return ret

  , @
