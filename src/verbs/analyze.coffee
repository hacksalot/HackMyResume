###*
Implementation of the 'analyze' verb for HackMyResume.
@module verbs/analyze
@license MIT. See LICENSE.md for details.
###



MKDIRP        = require('mkdirp')
PATH          = require('path')
HMEVENT       = require('../core/event-codes')
HMSTATUS      = require('../core/status-codes')
_             = require('underscore')
ResumeFactory = require('../core/resume-factory')
Verb          = require('../verbs/verb')
chalk         = require('chalk')



###* An invokable resume analysis command. ###
module.exports = class AnalyzeVerb extends Verb

  constructor: -> super 'analyze', _analyze



###* Private workhorse for the 'analyze' command. ###
_analyze = ( sources, dst, opts ) ->

  if !sources || !sources.length
    @err HMSTATUS.resumeNotFound, { quit: true }
    return null

  nlzrs = _loadInspectors()
  results = _.map sources, (src) ->
    r = ResumeFactory.loadOne src, format: 'FRESH', objectify: true, @
    return { } if opts.assert and @hasError()

    if r.fluenterror
      r.quit = opts.assert
      @err r.fluenterror, r
      r
    else
      _analyzeOne.call @, r, nlzrs, opts
  , @


  if @hasError() and !opts.assert
    @reject @errorCode
  else if !@hasError()
    @resolve results
  results



###* Analyze a single resume. ###
_analyzeOne = ( resumeObject, nlzrs, opts ) ->
  rez = resumeObject.rez
  safeFormat =
    if rez.meta and rez.meta.format and rez.meta.format.startsWith 'FRESH'
    then 'FRESH' else 'JRS'

  this.stat( HMEVENT.beforeAnalyze, { fmt: safeFormat, file: resumeObject.file })
  info = _.mapObject nlzrs, (val, key) ->  val.run rez
  this.stat HMEVENT.afterAnalyze, { info: info }
  info



_loadInspectors = ->
  totals: require '../inspectors/totals-inspector'
  coverage: require '../inspectors/gap-inspector'
  keywords: require '../inspectors/keyword-inspector'
