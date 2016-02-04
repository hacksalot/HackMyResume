###*
Implementation of the 'create' verb for HackMyResume.
@module verbs/create
@license MIT. See LICENSE.md for details.
###



MKDIRP = require 'mkdirp'
PATH = require 'path'
chalk = require 'chalk'
Verb = require '../verbs/verb'
_ = require 'underscore'
HMSTATUS = require '../core/status-codes'
HMEVENT = require '../core/event-codes'



module.exports = class CreateVerb extends Verb

  constructor: -> super 'new', _create



###* Create a new empty resume in either FRESH or JRS format. ###
_create = ( src, dst, opts ) ->

  if !src || !src.length
    @err HMSTATUS.createNameMissing, { quit: true }
    return null

  results = _.map src, ( t ) ->
    return { } if opts.assert and @hasError()
    r = _createOne.call @, t, opts
    if r.fluenterror
      r.quit = opts.assert
      @err r.fluenterror, r
    r
  , @

  if @hasError() and !opts.assert
    @reject @errorCode
  else if !@hasError()
    @resolve results
  results



###* Create a single new resume ###
_createOne = ( t, opts ) ->
  try
    ret = null
    safeFmt = opts.format.toUpperCase()
    @.stat HMEVENT.beforeCreate, { fmt: safeFmt, file: t }
    MKDIRP.sync PATH.dirname( t ) # Ensure dest folder exists;
    RezClass = require '../core/' + safeFmt.toLowerCase() + '-resume'
    newRez = RezClass.default()
    newRez.save t
    ret = newRez
    return
  catch
    ret =
      fluenterror: HMSTATUS.createError
      inner: _error
    return
  finally
    @.stat HMEVENT.afterCreate, fmt: safeFmt, file: t, isError: ret.fluenterror
    return ret
