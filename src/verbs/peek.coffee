###*
Implementation of the 'peek' verb for HackMyResume.
@module verbs/peek
@license MIT. See LICENSE.md for details.
###



Verb = require('../verbs/verb')
_ = require('underscore')
__ = require('lodash')
safeLoadJSON = require('../utils/safe-json-loader')
HMSTATUS = require('../core/status-codes')
HMEVENT = require('../core/event-codes')



module.exports = class PeekVerb extends Verb

  constructor: -> super 'peek', _peek



###* Peek at a resume, resume section, or resume field. ###
_peek = ( src, dst, opts ) ->

  if !src || !src.length
    @err HMSTATUS.resumeNotFound, { quit: true }
    return null

  objPath = (dst && dst[0]) || ''

  results = _.map src, ( t ) ->

    return { } if opts.assert and @hasError()

    tgt = _peekOne.call @, t, objPath
    if tgt.error
      @setError tgt.error.fluenterror, tgt.error
      #tgt.error.quit = opts.assert
      #@err tgt.error.fluenterror, tgt.error
    tgt
  , @

  if @hasError() and !opts.assert
    @reject @errorCode
  else if !@hasError()
    @resolve results
  results



###* Peek at a single resume, resume section, or resume field. ###
_peekOne = ( t, objPath ) ->

  @stat HMEVENT.beforePeek, { file: t, target: objPath }

  # Load the input file JSON 1st
  obj = safeLoadJSON t

  # Fetch the requested object path (or the entire file)
  tgt = null
  if !obj.ex
    tgt = if objPath then __.get obj.json, objPath else obj.json

  ## safeLoadJSON can only return a READ error or a PARSE error
  pkgError = null
  if obj.ex
    errCode = if obj.ex.operation == 'parse' then HMSTATUS.parseError else HMSTATUS.readError
    if errCode == HMSTATUS.readError
      obj.ex.quiet = true
    pkgError = fluenterror: errCode, inner: obj.ex

  # Fire the 'afterPeek' event with collected info
  @stat HMEVENT.afterPeek,
    file: t
    requested: objPath
    target: if obj.ex then undefined else tgt
    error: pkgError

  val: if obj.ex then undefined else tgt
  error: pkgError
