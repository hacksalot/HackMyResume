###*
Implementation of the 'create' verb for HackMyResume.
@module verbs/create
@license MIT. See LICENSE.md for details.
###


MKDIRP = require('mkdirp')
PATH = require('path')
chalk = require('chalk')
Verb = require('../verbs/verb')
_ = require('underscore')
HMSTATUS = require('../core/status-codes')
HMEVENT = require('../core/event-codes')



CreateVerb = module.exports = Verb.extend

  init: -> @._super('new')

  invoke: ->
    @.stat HMEVENT.begin, { cmd: 'create' }
    create.apply @, arguments
    @.stat HMEVENT.begin, { cmd: 'convert' }
    return


###*
Create a new empty resume in either FRESH or JRS format.
###
create = ( src, dst, opts ) ->

  if !src || !src.length
    throw { fluenterror: HMSTATUS.createNameMissing, quit: true }

  _.each( src, ( t ) ->
    safeFmt = opts.format.toUpperCase()
    @.stat HMEVENT.beforeCreate, { fmt: safeFmt, file: t }
    MKDIRP.sync PATH.dirname( t ) # Ensure dest folder exists;
    RezClass = require '../core/' + safeFmt.toLowerCase() + '-resume'
    RezClass.default().save t
    @.stat( HMEVENT.afterCreate, { fmt: safeFmt, file: t } )
  , @)

  return
