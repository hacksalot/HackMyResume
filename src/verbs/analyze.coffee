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



AnalyzeVerb = module.exports = Verb.extend

  init: -> @._super 'analyze'

  invoke: ->
    @.stat HMEVENT.begin, { cmd: 'analyze' }
    analyze.apply @, arguments
    @.stat HMEVENT.end



###*
Run the 'analyze' command.
###
analyze = ( sources, dst, opts ) ->

  if !sources || !sources.length
    throw
      fluenterror: HMSTATUS.resumeNotFound
      quit: true

  nlzrs = _loadInspectors()

  _.each(sources, (src) ->
    result = ResumeFactory.loadOne src, format: 'FRESH', objectify: true, @
    if result.fluenterror
      this.setError result.fluenterror, result
    else
      _analyze.call @, result, nlzrs, opts
  , @)



###*
Analyze a single resume.
###
_analyze = ( resumeObject, nlzrs, opts ) ->

  rez = resumeObject.rez
  safeFormat =
    if rez.meta and rez.meta.format and rez.meta.format.startsWith 'FRESH'
    then 'FRESH' else 'JRS'

  this.stat( HMEVENT.beforeAnalyze, { fmt: safeFormat, file: resumeObject.file })
  info = _.mapObject nlzrs, (val, key) ->  val.run rez
  this.stat HMEVENT.afterAnalyze, { info: info }



###*
Load inspectors.
###
_loadInspectors = ->
    totals: require '../inspectors/totals-inspector'
    coverage: require '../inspectors/gap-inspector'
    keywords: require '../inspectors/keyword-inspector'
