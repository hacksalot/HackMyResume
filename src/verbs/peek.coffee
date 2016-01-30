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



PeekVerb = module.exports = Verb.extend

  init: -> @._super('peek')

  invoke: ->
    @.stat HMEVENT.begin, { cmd: 'peek' }
    peek.apply @, arguments
    @.stat HMEVENT.end



###* Peek at a resume, resume section, or resume field. ###
peek = ( src, dst, opts ) ->

  if !src || !src.length
    throw: fluenterror: HMSTATUS.resumeNotFound

  objPath = (dst && dst[0]) || ''

  _.each src, ( t ) ->

    # Fire the 'beforePeek' event 2nd, so we have error/warning/success
    @.stat HMEVENT.beforePeek, { file: t, target: objPath }

    # Load the input file JSON 1st
    obj = safeLoadJSON t

    # Fetch the requested object path (or the entire file)
    tgt = null;
    if !obj.ex
      tgt = if objPath then __.get obj.json, objPath else obj.json;

    # Fire the 'afterPeek' event with collected info
    @.stat HMEVENT.afterPeek,
      file: t
      requested: objPath
      target: tgt
      error: obj.ex

    # safeLoadJSON can only return a READ error or a PARSE error
    if obj.ex
      errCode = if obj.ex.operation == 'parse' then HMSTATUS.parseError else HMSTATUS.readError
      if errCode == HMSTATUS.readError
        obj.ex.quiet = true
      @setError errCode, obj.ex
      @err errCode, obj.ex

  , @

  return
